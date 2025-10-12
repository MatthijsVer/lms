import { ReactNode } from "react";
import { CourseSidebar } from "../_components/CourseSidebar";
import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { getCourseRoadmapData } from "@/app/data/course/get-course-roadmap-data";
import { CourseSidebarWrapper } from "@/app/dashboard/_components/CourseSidebarWrapper";

interface iAppProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CourseLayout({ children, params }: iAppProps) {
  const { slug } = await params;

  // Fetch both sidebar data and roadmap data
  const course = await getCourseSidebarData(slug);
  const roadmapData = await getCourseRoadmapData(slug);

  return (
    <div className="flex flex-1">
      {/* sidebar - 30% */}
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebarWrapper
          regularSidebar={
            <div className="pt-6">
              <CourseSidebar course={course.course} />
            </div>
          }
          roadmapData={roadmapData}
        />
      </div>

      {/* Main Content - 70% */}
      <div className="flex-1 pr-6 overflow-hidden">{children}</div>
    </div>
  );
}
