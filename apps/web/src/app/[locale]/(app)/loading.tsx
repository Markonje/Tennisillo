import { Skeleton } from '@tennisillo/ui';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton variant="text" width="12rem" height="2rem" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        <Skeleton variant="rect" height="6rem" />
        <Skeleton variant="rect" height="6rem" />
        <Skeleton variant="rect" height="6rem" />
      </div>
      <Skeleton variant="rect" height="14rem" />
    </div>
  );
}
