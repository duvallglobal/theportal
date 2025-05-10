import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';

interface BrandStrategyStepProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  goToPreviousStep: () => void;
}

export const BrandStrategyStep: React.FC<BrandStrategyStepProps> = ({ form, onSubmit, goToPreviousStep }) => {
  return (
    <div className="bg-background-card rounded-xl shadow-md p-4 sm:p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-2 sm:mb-4">Step 3: Brand Strategy</h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Help us understand your brand and content style preferences.</p>
      
      <div className="space-y-4 sm:space-y-6">
        <FormField
          control={form.control}
          name="growthGoals"
          render={() => (
            <FormItem>
              <div className="mb-2 sm:mb-4">
                <FormLabel className="text-base sm:text-lg">Growth Goals</FormLabel>
                <p className="text-gray-400 text-xs sm:text-sm">Select all that apply to your goals</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {['More subscribers', 'Higher engagement', 'Increased visibility', 'Better content quality', 'Cross-platform growth', 'Monetization opportunities'].map((goal) => (
                  <FormField
                    key={goal}
                    control={form.control}
                    name="growthGoals"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-background/40 p-2 rounded-md">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(goal)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), goal])
                                  : field.onChange(field.value?.filter((value) => value !== goal) || []);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm sm:text-base m-0">
                            {goal}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contentTypes"
          render={() => (
            <FormItem>
              <div className="mb-2 sm:mb-4">
                <FormLabel className="text-base sm:text-lg">Content Types</FormLabel>
                <p className="text-gray-400 text-xs sm:text-sm">What types of content are you interested in creating?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {['Photos', 'Videos', 'Stories/Reels', 'Live streams', 'Text posts', 'Audio content'].map((type) => (
                  <FormField
                    key={type}
                    control={form.control}
                    name="contentTypes"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-background/40 p-2 rounded-md">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), type])
                                  : field.onChange(field.value?.filter((value) => value !== type) || []);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm sm:text-base m-0">
                            {type}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="brandDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg">Describe Your Brand</FormLabel>
              <FormControl>
                <Input placeholder="E.g., authentic, edgy, luxurious, etc." {...field} className="h-10 sm:h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="voiceTone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg">Voice Tone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select your preferred voice tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="playful">Playful & Fun</SelectItem>
                  <SelectItem value="seductive">Seductive & Mysterious</SelectItem>
                  <SelectItem value="professional">Professional & Polished</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative & Confident</SelectItem>
                  <SelectItem value="authentic">Raw & Authentic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="doNotSayTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg">Do Not Say Terms</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="List any terms or phrases you'd like to avoid in your content" 
                  className="min-h-[80px] sm:min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="flex justify-between mt-6 sm:mt-8">
        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base"
          onClick={goToPreviousStep}
        >
          <span className="mr-1 sm:mr-2">←</span> Previous
        </Button>
        <Button 
          type="button" 
          size="sm"
          className="h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base"
          onClick={form.handleSubmit(onSubmit)}
        >
          Next <span className="ml-1 sm:ml-2">→</span>
        </Button>
      </div>
    </div>
  );
};