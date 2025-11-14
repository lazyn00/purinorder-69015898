--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_fb text,
    customer_email text,
    customer_phone text NOT NULL,
    delivery_name text NOT NULL,
    delivery_phone text NOT NULL,
    delivery_address text NOT NULL,
    delivery_email text,
    items jsonb NOT NULL,
    total_price bigint NOT NULL,
    payment_method text NOT NULL,
    payment_proof_url text,
    status text DEFAULT 'chưa thanh toán'::text,
    deleted_at timestamp with time zone,
    payment_type text DEFAULT 'full'::text NOT NULL,
    order_number text,
    second_payment_proof_url text,
    CONSTRAINT check_payment_type CHECK ((payment_type = ANY (ARRAY['full'::text, 'deposit'::text])))
);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders public_delete_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_delete_orders ON public.orders FOR DELETE USING (true);


--
-- Name: orders public_insert_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_orders ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: orders public_select_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_select_orders ON public.orders FOR SELECT USING (true);


--
-- Name: orders public_update_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_update_orders ON public.orders FOR UPDATE USING (true);


--
-- PostgreSQL database dump complete
--


