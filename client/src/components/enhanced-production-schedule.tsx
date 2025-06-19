import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Package, Scale, Target, Plus, Edit, Trash2 } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';

const productionScheduleSchema = z.object({
  productId: z.number().min(1, 'Please select a product'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  targetAmount: z.number().min(0.1, 'Target amount must be at least 0.1'),
  unit: z.enum(['kg', 'packets'], { required_error: 'Please select a unit' }),
  priority: z.enum(['low', 'medium', 'high'], { required_error: 'Please select priority' }),
  notes: z.string().optional(),
});

type ProductionScheduleData = z.infer<typeof productionScheduleSchema>;

interface ProductionItem {
  id: number;
  productId: number;
  productName: string;
  scheduledDate: string;
  targetAmount: number;
  unit: 'kg' | 'packets';
  targetPackets?: number;
  packetsPerKg?: number;
  priority: 'low' | 'medium' | 'high';
  status: string;
  notes?: string;
  assignedTo?: string;
}

export default function EnhancedProductionSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: productionSchedule = [] } = useQuery({
    queryKey: ['/api/production-schedule', selectedDate],
  });

  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['/api/production-schedule/today'],
  });

  const form = useForm<ProductionScheduleData>({
    resolver: zodResolver(productionScheduleSchema),
    defaultValues: {
      scheduledDate: selectedDate,
      targetAmount: 1,
      unit: 'kg',
      priority: 'medium',
      notes: '',
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ProductionScheduleData) => {
      const response = await fetch('/api/production-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create schedule item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-schedule'] });
      form.reset({
        scheduledDate: selectedDate,
        targetAmount: 1,
        unit: 'kg',
        priority: 'medium',
        notes: '',
      });
      toast({
        title: "Schedule Created",
        description: "Production schedule item has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create production schedule item.",
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductionScheduleData> }) => {
      const response = await fetch(`/api/production-schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update schedule item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-schedule'] });
      setEditingItem(null);
      toast({
        title: "Schedule Updated",
        description: "Production schedule item has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update production schedule item.",
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/production-schedule/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete schedule item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-schedule'] });
      toast({
        title: "Schedule Deleted",
        description: "Production schedule item has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete production schedule item.",
        variant: "destructive",
      });
    },
  });

  const calculatePackets = (productId: number, targetKg: number): number => {
    const product = products.find((p: any) => p.id === productId);
    if (!product || !product.packetsPerKg) return 0;
    return Math.ceil(targetKg * product.packetsPerKg);
  };

  const onSubmit = (data: ProductionScheduleData) => {
    const scheduleData = {
      ...data,
      targetPackets: data.unit === 'kg' ? calculatePackets(data.productId, data.targetAmount) : data.targetAmount,
    };

    if (editingItem) {
      updateScheduleMutation.mutate({ id: editingItem.id, data: scheduleData });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (item: ProductionItem) => {
    setEditingItem(item);
    form.reset({
      productId: item.productId,
      scheduledDate: item.scheduledDate,
      targetAmount: item.targetAmount,
      unit: item.unit,
      priority: item.priority,
      notes: item.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    form.reset({
      scheduledDate: selectedDate,
      targetAmount: 1,
      unit: 'kg',
      priority: 'medium',
      notes: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    form.setValue('scheduledDate', selectedDate);
  }, [selectedDate, form]);

  return (
    <div className="space-y-6">
      {/* Today's Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Production Schedule
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No production scheduled for today</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.map((item: ProductionItem) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{item.productName}</h4>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{item.targetAmount} {item.unit}</span>
                      {item.unit === 'kg' && item.targetPackets && (
                        <span className="text-gray-400">({item.targetPackets} packets)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add/Edit Schedule Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingItem ? 'Edit Schedule Item' : 'Add to Production Schedule'}
            </CardTitle>
            <CardDescription>
              Schedule production by weight (kg) or packets with automatic packet calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select
                  value={form.watch('productId')?.toString() || ''}
                  onValueChange={(value) => form.setValue('productId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                        {product.packetsPerKg && (
                          <span className="text-gray-500 ml-2">
                            ({product.packetsPerKg} packets/kg)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.productId && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.productId.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  {...form.register('scheduledDate')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {form.formState.errors.scheduledDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.scheduledDate.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Amount</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register('targetAmount', { valueAsNumber: true })}
                    placeholder="Enter amount"
                  />
                  {form.formState.errors.targetAmount && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.targetAmount.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Unit</Label>
                  <Select
                    value={form.watch('unit')}
                    onValueChange={(value: 'kg' | 'packets') => form.setValue('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Kilograms (kg)
                        </div>
                      </SelectItem>
                      <SelectItem value="packets">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Packets
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Packet Calculation Preview */}
              {form.watch('unit') === 'kg' && form.watch('productId') && form.watch('targetAmount') && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Package className="h-4 w-4 inline mr-1" />
                    Estimated packets needed: {calculatePackets(form.watch('productId'), form.watch('targetAmount'))}
                  </p>
                </div>
              )}

              <div>
                <Label>Priority</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(value: 'low' | 'medium' | 'high') => form.setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  {...form.register('notes')}
                  placeholder="Additional notes or instructions"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                  className="flex-1"
                >
                  {editingItem ? 'Update Schedule' : 'Add to Schedule'}
                </Button>
                {editingItem && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Schedule Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Calendar</CardTitle>
            <CardDescription>View production schedule by date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="space-y-3">
                {productionSchedule.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No production scheduled for {format(new Date(selectedDate), 'MMM dd, yyyy')}
                  </p>
                ) : (
                  productionSchedule.map((item: ProductionItem) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{item.productName}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {item.targetAmount} {item.unit}
                            </span>
                            {item.unit === 'kg' && item.targetPackets && (
                              <span className="text-gray-400">
                                ({item.targetPackets} packets)
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteScheduleMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}