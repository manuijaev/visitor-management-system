import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { extractSignupError } from "./signupError";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

export default function useAdminSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setToast("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/staff/register/", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: "Admin",
      });
      await login(form.email, form.password);
      setToast("Admin account created. Redirecting...");
      setTimeout(() => navigate("/admin/dashboard"), 700);
    } catch (err) {
      setError(extractSignupError(err, "Unable to create admin account."));
      setSubmitting(false);
    }
  };

  return { form, error, toast, submitting, onChange, submit };
}
