import React from "react";

export function Table({ className = "", ...props }) {
  return <table className={`w-full text-sm ${className}`} {...props} />;
}

export function TableHeader({ className = "", ...props }) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className = "", ...props }) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return <tr className={`border-b border-gray-100 ${className}`} {...props} />;
}

export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={`text-right font-semibold text-gray-700 py-3 px-3 bg-gray-50 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }) {
  return <td className={`py-3 px-3 text-gray-800 ${className}`} {...props} />;
}
