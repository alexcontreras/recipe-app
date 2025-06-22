'use client';

import {useState, useEffect} from 'react';
import {collection, addDoc, Timestamp} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts/authContext';

// Interfaces for type safety, matching our Firestore data model
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeFormData {
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  userId: string;
  imageUrl?: string; // Optional
  categories?: string[]; // Optional
  createdAt: Timestamp; // Firestore Timestamp
}

export default function AddRecipePage() {
  const router = useRouter();
  const {currentUser, loading: authLoading} = useAuth();

  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {name: '', quantity: 0, unit: ''},
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [cookingTime, setCookingTime] = useState<number | ''>('');
  const [servings, setServings] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState(''); // Comma-separated string initially
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Show loading spinner or null while authentication state is being determined
  if (authLoading) {
    return (
      <div className="p-4 text-center">Loading authentication state...</div>
    );
  }

  // If not loading and no current user, this component should not render,
  // as the useEffect above will redirect. But we keep it to explicitly not render content
  if (!currentUser) {
    return null;
  }

  // --- Handlers for dynamic lists ---
  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const newIngredients = [...ingredients];
    (newIngredients[index][field] as unknown) = value; // Type assertion for flexibility
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, {name: '', quantity: 0, unit: ''}]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    const newInstructions = instructions.filter((_, i) => i !== index);
    setInstructions(newInstructions);
  };

  // --- End Handlers for dynamic lists ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (
      !recipeName ||
      ingredients.some((ing) => !ing.name || !ing.quantity || !ing.unit) ||
      instructions.some((inst) => !inst) ||
      cookingTime === '' ||
      servings === ''
    ) {
      setError(
        'Please fill in all required fields, including all ingredients and instruction details.'
      );
      setLoading(false);
      return;
    }

    const recipeData: RecipeFormData = {
      // Use 'any' temporarily if strict type doesn't allow partials, or build typed Recipe object carefully
      name: recipeName,
      ingredients: ingredients.filter(
        (ing) => ing.name && ing.quantity && ing.unit
      ),
      instructions: instructions.filter((inst) => inst.trim() !== ''),
      cookingTime: Number(cookingTime),
      servings: Number(servings),
      userId: currentUser.uid,
      createdAt: Timestamp.now(),
    };

    // Conditionally add imageUrl if it's a non-empty string
    if (imageUrl.trim() !== '') {
      recipeData.imageUrl = imageUrl.trim();
    }

    // Conditionally add categories if the string is not empty after splitting
    const parsedCategories = categories
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat !== '');
    if (parsedCategories.length > 0) {
      recipeData.categories = parsedCategories;
    }

    try {
      await addDoc(collection(db, 'recipes'), recipeData);
      setSuccess('Recipe added successfully!');
      // Optionally reset form fields or redirect
      setRecipeName('');
      setIngredients([{name: '', quantity: 0, unit: ''}]);
      setInstructions(['']);
      setCookingTime('');
      setServings('');
      setImageUrl('');
      setCategories('');

      router.push('/recipes'); // Redirect to the recipes list page
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to add recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-4xl font-bold text-center mb-8">Add New Recipe</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 mb-8">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="recipeName"
            className="block text-gray-700 text-sm font-bold mb-2">
            Recipe Name:
          </label>
          <input
            type="text"
            id="recipeName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Ingredients:
          </label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="number"
                placeholder="Qty"
                className="shadow appearance-none border rounded w-1/6 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={ingredient.quantity === 0 ? '' : ingredient.quantity}
                onChange={(e) =>
                  handleIngredientChange(
                    index,
                    'quantity',
                    Number(e.target.value)
                  )
                }
                min="0"
                required
              />
              <input
                type="text"
                placeholder="Unit (e.g., cups, grams)"
                className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(index, 'unit', e.target.value)
                }
                required
              />
              <input
                type="text"
                placeholder="Ingredient Name (e.g., Chicken Breast)"
                className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(index, 'name', e.target.value)
                }
                required
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="text-red-500 hover:text-red-700 font-bold px-2">
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2">
            Add Ingredient
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Instructions:
          </label>
          {instructions.map((instruction, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <textarea
                placeholder={`Step ${index + 1}`}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                rows={2}
                required
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="text-red-500 hover:text-red-700 font-bold px-2">
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addInstruction}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2">
            Add Instruction Step
          </button>
        </div>

        <div className="mb-4">
          <label
            htmlFor="cookingTime"
            className="block text-gray-700 text-sm font-bold mb-2">
            Cooking Time (minutes):
          </label>
          <input
            type="number"
            id="cookingTime"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={cookingTime === 0 ? '' : cookingTime}
            onChange={(e) => setCookingTime(Number(e.target.value))}
            min="0"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="servings"
            className="block text-gray-700 text-sm font-bold mb-2">
            Servings:
          </label>
          <input
            type="number"
            id="servings"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={servings === 0 ? '' : servings}
            onChange={(e) => setServings(Number(e.target.value))}
            min="1"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="imageUrl"
            className="block text-gray-700 text-sm font-bold mb-2">
            Image URL (Optional):
          </label>
          <input
            type="url"
            id="imageUrl"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="e.g., https://example.com/recipe.jpg"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="categories"
            className="block text-gray-700 text-sm font-bold mb-2">
            Categories (Optional, comma-separated):
          </label>
          <input
            type="text"
            id="categories"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="e.g., Italian, Dinner, Vegetarian"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}>
            {loading ? 'Adding Recipe...' : 'Add Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
