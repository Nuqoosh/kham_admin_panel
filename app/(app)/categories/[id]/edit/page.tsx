"use client";

import { useParams } from "next/navigation";
import { CategoryEditLoader } from "@/components/forms/category-form";

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  return <CategoryEditLoader categoryId={params.id} />;
}
