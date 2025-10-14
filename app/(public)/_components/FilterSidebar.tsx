"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { CourseLevel } from "@/lib/types";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minDuration, setMinDuration] = useState(
    searchParams.get("minDuration") || ""
  );
  const [maxDuration, setMaxDuration] = useState(
    searchParams.get("maxDuration") || ""
  );

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);

    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const currentValues = params.get(key)?.split(",").filter(Boolean) || [];

    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    if (newValues.length === 0) {
      params.delete(key);
    } else {
      params.set(key, newValues.join(","));
    }

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinDuration("");
    setMaxDuration("");

    startTransition(() => {
      router.push(window.location.pathname);
    });
  };

  const isLevelChecked = (level: CourseLevel) => {
    const levels = searchParams.get("levels")?.split(",") || [];
    return levels.includes(level);
  };

  const isRatingChecked = (rating: number) => {
    return searchParams.get("minRating") === rating.toString();
  };

  return (
    <aside className="flex flex-col space-y-6 w-80 min-w-80 sticky top-4">
      {/* Search */}
      <div className="flex flex-col space-y-2">
        <Label htmlFor="search" className="font-medium text-sm">
          Search
        </Label>
        <Input
          id="search"
          placeholder="Search courses..."
          className="rounded-none border-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters("search", search);
            }
          }}
          onBlur={() => updateFilters("search", search)}
        />
      </div>

      {/* Sort */}
      <div className="flex flex-col space-y-2">
        <Label htmlFor="sort" className="font-medium text-sm">
          Sort By
        </Label>
        <Select
          value={searchParams.get("sortBy") || "newest"}
          onValueChange={(value) => updateFilters("sortBy", value)}
        >
          <SelectTrigger id="sort" className="w-full rounded-none">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price-high-low">Price: High to Low</SelectItem>
            <SelectItem value="price-low-high">Price: Low to High</SelectItem>
            <SelectItem value="duration-long-short">
              Duration: Longest First
            </SelectItem>
            <SelectItem value="duration-short-long">
              Duration: Shortest First
            </SelectItem>
            <SelectItem value="title-az">Title: A-Z</SelectItem>
            <SelectItem value="title-za">Title: Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div className="flex flex-col space-y-2">
        <Label className="font-medium text-sm">Minimum Rating</Label>
        <div className="flex flex-col space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={isRatingChecked(rating)}
                onCheckedChange={() => {
                  updateFilters(
                    "minRating",
                    isRatingChecked(rating) ? null : rating.toString()
                  );
                }}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="flex items-center space-x-1 cursor-pointer"
              >
                <span className="text-sm font-normal">{rating}</span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-4 h-4 ${
                        index < rating
                          ? "fill-primary text-primary"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">& up</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col space-y-2">
        <Label className="font-medium text-sm">Price Range (€)</Label>
        <div className="flex items-center w-full gap-x-4">
          <Input
            type="number"
            placeholder="Min"
            className="rounded-none border-input"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => updateFilters("minPrice", minPrice)}
          />
          <Input
            type="number"
            placeholder="Max"
            className="rounded-none border-input"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => updateFilters("maxPrice", maxPrice)}
          />
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col space-y-2">
        <Label className="font-medium text-sm">Duration (hours)</Label>
        <div className="flex items-center w-full gap-x-4">
          <Input
            type="number"
            placeholder="Min"
            className="rounded-none border-input"
            min="0"
            value={minDuration}
            onChange={(e) => setMinDuration(e.target.value)}
            onBlur={() => updateFilters("minDuration", minDuration)}
          />
          <Input
            type="number"
            placeholder="Max"
            className="rounded-none border-input"
            min="0"
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
            onBlur={() => updateFilters("maxDuration", maxDuration)}
          />
        </div>
      </div>

      {/* Course Level */}
      <div className="flex flex-col space-y-2">
        <Label className="font-medium text-sm">Level</Label>
        <div className="flex flex-col space-y-3">
          {(["Beginner", "Intermediate", "Advanced"] as CourseLevel[]).map(
            (level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level.toLowerCase()}
                  checked={isLevelChecked(level)}
                  onCheckedChange={() => toggleArrayFilter("levels", level)}
                />
                <label
                  htmlFor={level.toLowerCase()}
                  className="text-sm font-normal cursor-pointer"
                >
                  {level}
                </label>
              </div>
            )
          )}
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col space-y-2">
        <Label htmlFor="category" className="font-medium text-sm">
          Category
        </Label>
        <Select
          value={searchParams.get("categories") || "all"}
          onValueChange={(value) =>
            updateFilters("categories", value === "all" ? null : value)
          }
        >
          <SelectTrigger id="category" className="w-full rounded-none">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="programming">Programming</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="data-science">Data Science</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      <button
        type="button"
        onClick={clearAllFilters}
        disabled={isPending}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 text-left disabled:opacity-50"
      >
        Clear all filters
      </button>
    </aside>
  );
}
