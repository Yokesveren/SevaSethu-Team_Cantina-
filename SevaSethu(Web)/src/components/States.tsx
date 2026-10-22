export const Loading = () => <div className="p-6 text-phc-muted text-[13px]">Loading content...</div>;
export const EmptyState = ({ title }: { title: string }) => (
  <div className="p-12 text-phc-muted text-center border border-dashed border-phc-border rounded-lg bg-phc-surface">
    <div className="text-[14px] font-medium">No {title} found</div>
    <div className="text-[12px] mt-1">Try adjusting your filters or search.</div>
  </div>
);
export const ErrorState = ({ message }: { message: string }) => (
  <div className="p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg text-[13px]">
    <span className="font-semibold">Error:</span> {message}
  </div>
);
