"use client";

import { useParams } from "next/navigation";
import { BrandEditLoader } from "@/components/forms/brand-form";

export default function EditBrandPage() {
  const params = useParams<{ id: string }>();
  return <BrandEditLoader brandId={params.id} />;
}
