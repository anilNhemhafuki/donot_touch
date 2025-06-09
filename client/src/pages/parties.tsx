import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Parties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<any>(null);
  const { toast } = useToast();

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["/api/parties"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/parties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsDialogOpen(false);
      setEditingParty(null);
      toast({ title: "Success", description: "Party saved successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/parties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsDialogOpen(false);
      setEditingParty(null);
      toast({ title: "Success", description: "Party updated successfully" });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      paymentTerms: formData.get("paymentTerms"),
      outstandingAmount: parseFloat(formData.get("outstandingAmount") as string) || 0,
    };

    if (editingParty) {
      updateMutation.mutate({ id: editingParty.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredParties = (parties as any[]).filter((party: any) =>
    party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parties (Suppliers/Vendors)</h1>
          <p className="text-muted-foreground">Manage supplier and vendor relationships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingParty(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
              <DialogDescription>
                Enter supplier/vendor details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                name="name"
                placeholder="Party Name"
                defaultValue={editingParty?.name || ""}
                required
              />
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                defaultValue={editingParty?.email || ""}
              />
              <Input
                name="phone"
                placeholder="Phone Number"
                defaultValue={editingParty?.phone || ""}
              />
              <Input
                name="address"
                placeholder="Address"
                defaultValue={editingParty?.address || ""}
              />
              <Input
                name="paymentTerms"
                placeholder="Payment Terms (e.g., Net 30)"
                defaultValue={editingParty?.paymentTerms || ""}
              />
              <Input
                name="outstandingAmount"
                type="number"
                step="0.01"
                placeholder="Outstanding Amount (Rs.)"
                defaultValue={editingParty?.outstandingAmount || "0"}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingParty ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Parties List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Outstanding Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParties.map((party: any) => (
                  <TableRow key={party.id}>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell>{party.email}</TableCell>
                    <TableCell>{party.phone}</TableCell>
                    <TableCell>{party.paymentTerms}</TableCell>
                    <TableCell>
                      <span className={party.outstandingAmount > 0 ? "text-red-600" : "text-green-600"}>
                        Rs. {parseFloat(party.outstandingAmount || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={party.isActive ? "default" : "secondary"}>
                        {party.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingParty(party);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}