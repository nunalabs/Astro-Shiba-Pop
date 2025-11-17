/**
 * Create Token Form Component
 *
 * Form for creating new meme tokens with bonding curves
 */

'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCreateToken } from '@/hooks/useTokenFactoryQueries';
import type { CurveType } from '@/lib/contracts/token-factory/dist';
import { Loader2, Rocket } from 'lucide-react';

// Form validation schema
const createTokenSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(32, 'Name must be less than 32 characters'),
  symbol: z
    .string()
    .min(2, 'Symbol must be at least 2 characters')
    .max(12, 'Symbol must be less than 12 characters')
    .regex(/^[A-Z0-9]+$/, 'Symbol must be uppercase letters and numbers only'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  initialSupply: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1_000_000, {
      message: 'Initial supply must be at least 1,000,000',
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 1_000_000_000_000_000, {
      message: 'Initial supply must be less than 1 quadrillion',
    }),
  curveType: z.enum(['Linear', 'Exponential', 'Sigmoid']),
  decimals: z.literal(7), // Fixed at 7 for Stellar
});

type CreateTokenFormValues = z.infer<typeof createTokenSchema>;

export function CreateTokenForm() {
  const { toast } = useToast();
  const createToken = useCreateToken();
  const [isSimulating, setIsSimulating] = useState(false);

  const form = useForm<CreateTokenFormValues>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      imageUrl: '',
      initialSupply: '1000000000', // 1 billion with 7 decimals = 100 tokens
      curveType: 'Linear',
      decimals: 7,
    },
  });

  const onSubmit = async (values: CreateTokenFormValues) => {
    try {
      setIsSimulating(true);

      // Convert curve type to contract format
      const curveType: CurveType = {
        tag: values.curveType,
        values: undefined as void,
      };

      // Build metadata URI (in production, upload to IPFS first)
      const metadataUri = `data:application/json,${encodeURIComponent(
        JSON.stringify({
          name: values.name,
          symbol: values.symbol,
          description: values.description,
          image: values.imageUrl || '',
        })
      )}`;

      // Create token
      const result = await createToken.mutateAsync({
        name: values.name,
        symbol: values.symbol,
        decimals: values.decimals,
        initialSupply: BigInt(values.initialSupply),
        metadataUri,
        curveType,
      });

      toast({
        title: 'Token Created! 🎉',
        description: `${values.name} (${values.symbol}) has been created successfully.`,
      });

      // Reset form
      form.reset();
    } catch (error) {
      console.error('Create token error:', error);
      toast({
        title: 'Error Creating Token',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Create Your Meme Token
        </CardTitle>
        <CardDescription>
          Launch your token with a bonding curve for automatic price discovery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Astro Shiba" {...field} />
                  </FormControl>
                  <FormDescription>
                    The full name of your token (3-32 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symbol */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SHIBA"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Token ticker symbol (2-12 uppercase letters/numbers)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="The coolest meme token in the galaxy..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Tell people about your token (10-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to your token's image (IPFS recommended)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Initial Supply */}
              <FormField
                control={form.control}
                name="initialSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Supply</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000000000" {...field} />
                    </FormControl>
                    <FormDescription>Total tokens to create</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Curve Type */}
              <FormField
                control={form.control}
                name="curveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonding Curve</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select curve type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Linear">
                          Linear (Steady Growth)
                        </SelectItem>
                        <SelectItem value="Exponential">
                          Exponential (Anti-Dump 🔒)
                        </SelectItem>
                        <SelectItem value="Sigmoid">
                          Sigmoid (S-Curve)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Price curve mechanism</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Creation Fee</div>
                <div className="text-lg font-bold">0.01 XLM</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Decimals</div>
                <div className="text-lg font-bold">7</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Sell Penalty</div>
                <div className="text-lg font-bold">
                  {form.watch('curveType') === 'Exponential' ? '3%' : '2%'}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSimulating || createToken.isPending}
            >
              {isSimulating || createToken.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Token...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Create Token
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
