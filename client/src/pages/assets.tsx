import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const { toast } = useToast();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["/api/assets"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
      toast({ title: "Success", description: "Asset saved successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/assets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
      toast({ title: "Success", description: "Asset updated successfully" });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      category: formData.get("category"),
      purchaseDate: formData.get("purchaseDate"),
      purchasePrice: parseFloat(formData.get("purchasePrice") as string) || 0,
      currentValue: parseFloat(formData.get("currentValue") as string) || 0,
      description: formData.get("description"),
      location: formData.get("location"),
      condition: formData.get("condition"),
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getConditionColor = (condition: string) => {
    switch(condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssets = (assets as any[]).filter((asset: any) =>
    asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assets Management</h1>
          <p className="text-muted-foreground">Track company assets and equipment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAsset(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
              <DialogDescription>
                Enter asset details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <Input
                name="name"
                placeholder="Asset Name"
                defaultValue={editingAsset?.name || ""}
                required
              />
              <Select name="category" defaultValue={editingAsset?.category || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="purchaseDate"
                type="date"
                defaultValue={editingAsset?.purchaseDate?.split('T')[0] || ""}
              />
              <Input
                name="purchasePrice"
                type="number"
                step="0.01"
                placeholder="Purchase Price (Rs.)"
                defaultValue={editingAsset?.purchasePrice || ""}
              />
              <Input
                name="currentValue"
                type="number"
                step="0.01"
                placeholder="Current Value (Rs.)"
                defaultValue={editingAsset?.currentValue || ""}
              />
              <Input
                name="location"
                placeholder="Location"
                defaultValue={editingAsset?.location || ""}
              />
              <Select name="condition" defaultValue={editingAsset?.condition || "good"}>
                <SelectTrigger>
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-2">
                <Input
                  name="description"
                  placeholder="Description"
                  defaultValue={editingAsset?.description || ""}
                />
              </div>
              <div className="col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAsset ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset: any) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="capitalize">{asset.category}</TableCell>
                    <TableCell>Rs. {parseFloat(asset.purchasePrice || 0).toFixed(2)}</TableCell>
                    <TableCell>Rs. {parseFloat(asset.currentValue || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(asset.condition)}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAsset(asset);
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