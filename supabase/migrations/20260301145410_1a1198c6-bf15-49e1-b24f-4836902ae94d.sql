
-- Function to atomically decrement product stock (no variant)
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id integer, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
  WHERE id = p_product_id AND stock IS NOT NULL;
END;
$$;

-- Function to atomically decrement variant stock within a product's variants JSONB
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_product_id integer, p_variant_name text, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variants jsonb;
  v_new_variants jsonb := '[]'::jsonb;
  v_element jsonb;
  i integer;
BEGIN
  SELECT variants INTO v_variants FROM products WHERE id = p_product_id FOR UPDATE;
  
  IF v_variants IS NULL THEN
    RETURN;
  END IF;

  FOR i IN 0..jsonb_array_length(v_variants) - 1 LOOP
    v_element := v_variants->i;
    IF v_element->>'name' = p_variant_name AND v_element ? 'stock' THEN
      v_element := jsonb_set(
        v_element,
        '{stock}',
        to_jsonb(GREATEST(0, COALESCE((v_element->>'stock')::integer, 0) - p_quantity))
      );
    END IF;
    v_new_variants := v_new_variants || jsonb_build_array(v_element);
  END LOOP;

  UPDATE products SET variants = v_new_variants WHERE id = p_product_id;
END;
$$;
