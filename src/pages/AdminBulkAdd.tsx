import { useNavigate } from "react-router-dom";
import BulkProductForm from "@/components/BulkProductForm";

export default function AdminBulkAdd() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("admin_user") || "Admin";

  return (
    <BulkProductForm
      open={true}
      onClose={() => navigate("/admin")}
      currentUser={currentUser}
    />
  );
}
