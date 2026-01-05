import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl bg-white shadow-lg border border-gray-100 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={`p-5 border-b border-gray-100 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h2 className={`text-lg font-semibold ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={`p-5 ${className}`} {...props} />;
}
