import "server-only";
import { prisma } from "@/lib/db";
import { CourseLevel, Prisma } from "@/lib/generated/prisma";

export type CourseFilters = {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  levels?: CourseLevel[];
  categories?: string[];
  minRating?: number;
  sortBy?: 
    | "price-high-low"
    | "price-low-high"
    | "duration-long-short"
    | "duration-short-long"
    | "newest"
    | "oldest"
    | "title-az"
    | "title-za"
    | "rating-high-low"
    | "rating-low-high";
  page?: number;
  pageSize?: number;
};

export type PaginatedCourses = {
  courses: Awaited<ReturnType<typeof getAllCourses>>["courses"];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getAllCourses(filters?: CourseFilters) {
  // Remove this in production - just for demo
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 9;
  const skip = (page - 1) * pageSize;

  // Build the where clause dynamically
  const where: Prisma.CourseWhereInput = {
    status: "Published",
  };

  // Search filter (searches in title, description, and smallDescription)
  if (filters?.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        smallDescription: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Price range filter
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  // Duration range filter
  if (filters?.minDuration !== undefined || filters?.maxDuration !== undefined) {
    where.duration = {};
    if (filters.minDuration !== undefined) {
      where.duration.gte = filters.minDuration;
    }
    if (filters.maxDuration !== undefined) {
      where.duration.lte = filters.maxDuration;
    }
  }

  // Level filter
  if (filters?.levels && filters.levels.length > 0) {
    where.level = {
      in: filters.levels,
    };
  }

  // Category filter
  if (filters?.categories && filters.categories.length > 0) {
    where.category = {
      in: filters.categories,
    };
  }

  // Build the orderBy clause
  let orderBy: Prisma.CourseOrderByWithRelationInput = {
    createdAt: "desc",
  };

  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case "price-high-low":
        orderBy = { price: "desc" };
        break;
      case "price-low-high":
        orderBy = { price: "asc" };
        break;
      case "duration-long-short":
        orderBy = { duration: "desc" };
        break;
      case "duration-short-long":
        orderBy = { duration: "asc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "title-az":
        orderBy = { title: "asc" };
        break;
      case "title-za":
        orderBy = { title: "desc" };
        break;
    }
  }

  // Get total count for pagination
  const totalItems = await prisma.course.count({ where });

  // Get paginated data
  const courses = await prisma.course.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
    select: {
      title: true,
      price: true,
      smallDescription: true,
      slug: true,
      fileKey: true,
      id: true,
      level: true,
      duration: true,
      category: true,
    },
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    courses,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>["courses"][0];