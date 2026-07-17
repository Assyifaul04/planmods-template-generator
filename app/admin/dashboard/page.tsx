// app/admin/dashboard/page.tsx
"use client";

import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive"
import { DataTable } from "@/components/admin/data-table"
import { SectionCards } from "@/components/admin/section-cards"

// Sample data matching the DataTable schema
const sampleData = [
  {
    id: 1,
    header: "Project Overview",
    type: "Table of Contents",
    status: "Done",
    target: "100%",
    limit: "50",
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "Technical Specifications",
    type: "Technical Approach",
    status: "In Progress",
    target: "75%",
    limit: "30",
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: 3,
    header: "Design Documentation",
    type: "Design",
    status: "Not Started",
    target: "0%",
    limit: "20",
    reviewer: "Assign reviewer",
  },
  {
    id: 4,
    header: "API Documentation",
    type: "Technical Approach",
    status: "Done",
    target: "100%",
    limit: "40",
    reviewer: "Emily Whalen",
  },
  {
    id: 5,
    header: "User Guide",
    type: "Narrative",
    status: "In Progress",
    target: "60%",
    limit: "25",
    reviewer: "Eddie Lake",
  },
]

export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="px-4 lg:px-6">
        <DataTable data={sampleData} />
      </div>
    </>
  )
}