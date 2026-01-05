import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ExpenseTable({ expenses }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = expenses.filter(expense =>
    expense.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>כל העסקאות</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש לפי שם עסק, סוג עסקה או הערות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך</TableHead>
                <TableHead className="text-right">בית עסק</TableHead>
                <TableHead className="text-right">סכום</TableHead>
                <TableHead className="text-right">סוג עסקה</TableHead>
                <TableHead className="text-right">מועד חיוב</TableHead>
                <TableHead className="text-right">הערות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.transaction_date}</TableCell>
                  <TableCell className="font-medium">{expense.business_name}</TableCell>
                  <TableCell className="font-semibold text-blue-600">
                    ₪{expense.amount?.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{expense.transaction_type}</TableCell>
                  <TableCell>{expense.charge_date}</TableCell>
                  <TableCell className="text-gray-600">{expense.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          מציג {filteredExpenses.length} מתוך {expenses.length} עסקאות
        </div>
      </CardContent>
    </Card>
  );
}