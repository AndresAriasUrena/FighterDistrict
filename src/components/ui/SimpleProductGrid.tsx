export interface SimpleProductGridProps {
    children: React.ReactNode;
    cols: number;
    gap?: string;
  }
  
  export default function SimpleProductGrid({
    children,
    cols,
    gap
  }: SimpleProductGridProps) {
    return (
      <div className={`grid grid-cols-${cols} gap-${gap}`}>
        {children}
      </div>
    );
  }
  