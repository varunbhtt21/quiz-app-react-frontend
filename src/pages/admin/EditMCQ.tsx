
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Layout from '../../components/common/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MCQFormData {
  title: string;
  description: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation?: string;
}

const EditMCQ = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MCQFormData>();

  useEffect(() => {
    // Load MCQ data - mock data for now
    const mockMCQ = {
      title: 'What is React?',
      description: 'Choose the correct definition of React',
      option_a: 'A JavaScript library',
      option_b: 'A programming language',
      option_c: 'A database',
      option_d: 'An operating system',
      correct_options: ['A'],
      explanation: 'React is a JavaScript library for building user interfaces'
    };

    setValue('title', mockMCQ.title);
    setValue('description', mockMCQ.description);
    setValue('option_a', mockMCQ.option_a);
    setValue('option_b', mockMCQ.option_b);
    setValue('option_c', mockMCQ.option_c);
    setValue('option_d', mockMCQ.option_d);
    setValue('explanation', mockMCQ.explanation);
    setCorrectOptions(mockMCQ.correct_options);
  }, [id, setValue]);

  const onSubmit = async (data: MCQFormData) => {
    if (correctOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one correct option",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Updating MCQ:', { ...data, correct_options: correctOptions });
      
      toast({
        title: "Success",
        description: "MCQ updated successfully"
      });
      
      navigate('/admin/mcq');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update MCQ",
        variant: "destructive"
      });
    }
  };

  const handleCorrectOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      setCorrectOptions([...correctOptions, option]);
    } else {
      setCorrectOptions(correctOptions.filter(opt => opt !== option));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/mcq')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit MCQ</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>MCQ Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter question title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Enter question description"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="option_a">Option A *</Label>
                  <Input
                    id="option_a"
                    {...register('option_a', { required: 'Option A is required' })}
                    placeholder="Enter option A"
                  />
                  {errors.option_a && (
                    <p className="text-sm text-red-600">{errors.option_a.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="option_b">Option B *</Label>
                  <Input
                    id="option_b"
                    {...register('option_b', { required: 'Option B is required' })}
                    placeholder="Enter option B"
                  />
                  {errors.option_b && (
                    <p className="text-sm text-red-600">{errors.option_b.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="option_c">Option C *</Label>
                  <Input
                    id="option_c"
                    {...register('option_c', { required: 'Option C is required' })}
                    placeholder="Enter option C"
                  />
                  {errors.option_c && (
                    <p className="text-sm text-red-600">{errors.option_c.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="option_d">Option D *</Label>
                  <Input
                    id="option_d"
                    {...register('option_d', { required: 'Option D is required' })}
                    placeholder="Enter option D"
                  />
                  {errors.option_d && (
                    <p className="text-sm text-red-600">{errors.option_d.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Correct Options *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`correct_${option}`}
                        checked={correctOptions.includes(option)}
                        onCheckedChange={(checked) => 
                          handleCorrectOptionChange(option, checked as boolean)
                        }
                      />
                      <Label htmlFor={`correct_${option}`}>Option {option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  {...register('explanation')}
                  placeholder="Enter explanation for the correct answer"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/mcq')}>
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Update MCQ</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditMCQ;
