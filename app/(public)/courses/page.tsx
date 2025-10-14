import {
  getAllCourses,
  CourseFilters,
} from "@/app/data/course/get-all-courses";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "../_components/PublicCourseCard";
import { Suspense } from "react";
import { CourseLevel } from "@/lib/generated/prisma";
import FilterSidebar from "../_components/FilterSidebar";
import Pagination from "../_components/Pagination";

export const dynamic = "force-dynamic";

type SearchParams = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  minDuration?: string;
  maxDuration?: string;
  levels?: string;
  categories?: string;
  minRating?: string;
  sortBy?: string;
  page?: string;
};

export default async function PublicCoursesRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="mt-5">
      <div className="flex flex-col space-y-2 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
          Explore Courses
        </h1>
        <p className="text-muted-foreground">
          Discover our wide range of courses designed to help you achieve your
          learning goals.
        </p>
      </div>

      <div className="flex items-start gap-x-10">
        <FilterSidebar />

        <div className="flex-1">
          <Suspense fallback={<LoadingSkeletonLayout />}>
            <RenderCourses searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RenderCourses({ searchParams }: { searchParams: SearchParams }) {
  const filters: CourseFilters = {
    search: searchParams.search,
    minPrice: searchParams.minPrice
      ? parseInt(searchParams.minPrice)
      : undefined,
    maxPrice: searchParams.maxPrice
      ? parseInt(searchParams.maxPrice)
      : undefined,
    minDuration: searchParams.minDuration
      ? parseInt(searchParams.minDuration)
      : undefined,
    maxDuration: searchParams.maxDuration
      ? parseInt(searchParams.maxDuration)
      : undefined,
    levels: searchParams.levels
      ? (searchParams.levels.split(",") as CourseLevel[])
      : undefined,
    categories: searchParams.categories
      ? searchParams.categories.split(",")
      : undefined,
    minRating: searchParams.minRating
      ? parseInt(searchParams.minRating)
      : undefined,
    sortBy: searchParams.sortBy as CourseFilters["sortBy"],
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 9, // 3x3 grid
  };

  const { courses, pagination } = await getAllCourses(filters);

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg">
          No courses found matching your filters.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} -{" "}
        {Math.min(
          pagination.currentPage * pagination.pageSize,
          pagination.totalItems
        )}{" "}
        of {pagination.totalItems} courses
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <PublicCourseCard key={course.id} data={course} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.hasNextPage}
        hasPreviousPage={pagination.hasPreviousPage}
      />
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="flex flex-col">
      <div className="mb-4 h-5 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, index) => (
          <PublicCourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
