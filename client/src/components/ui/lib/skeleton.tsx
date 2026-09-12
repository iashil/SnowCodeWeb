import { cn } from "./lib/utils";

function Skeleton({ className, ...props }: any) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} {...props} />
  );
}

export { Skeleton };
