'use client';

import {useEffect, useState} from 'react';
import {collection, getDocs, Timestamp} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';

// Define the Recipe interface based on our data model
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  userId: string;
  imageUrl?: string;
  categories?: string[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'recipes'));
        const recipesList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Untitled Recipe', // Provide a default if name is missing
            ingredients: (data.ingredients || []) as Ingredient[], // Ensure it's an array, default to empty
            instructions: (data.instructions || []) as string[], // Ensure it's an array, default to empty
            cookingTime: data.cookingTime ?? 0, // Default to 0 if missing/null/undefined
            servings: data.servings ?? 0, // Default to 0 if missing/null/undefined
            userId: data.userId || 'unknown', // Default to 'unknown' if missing
            imageUrl: data.imageUrl || '', // Default to empty string if missing/undefined
            categories: (data.categories || []) as string[], // Ensure it's an array, default to empty
            // If you added `createdAt` in Firestore, you might want to convert it
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : undefined,
          } as Recipe;
        });
        setRecipes(recipesList);
      } catch (error) {
        console.error('Error fetching recipes: ', error);
        setError('Failed to loead recipes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading recipes...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Our Recipes</h1>
      <div className="text-center mb-6">
        <Link
          href="/recipes/new"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-block">
          Add New Recipe
        </Link>
      </div>
      {recipes.length === 0 ? (
        <p className="text-center text-gray-500">
          No recipes found. Be the first to add one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block">
              <div
                key={recipe.id}
                className="bg-white shadow-lg rounded-lg overflow-hidden">
                {recipe.imageUrl && (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-2xl text-black font-semibold mb-2">
                    {recipe.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Servings: {recipe.servings} | Prep/Cook Time:{' '}
                    {recipe.cookingTime} mins
                  </p>
                  <div className="mb-4">
                    <h3 className="text-lg text-black font-medium mb-2">
                      Ingredients:
                    </h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {recipe.ingredients.map((ing, index) => (
                        <li key={index}>
                          {ing.quantity} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg text-black font-medium mb-2">
                      Instructions:
                    </h3>
                    <ol className="list-decimal list-inside text-gray-700">
                      {recipe.instructions.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  {recipe.categories && recipe.categories.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500">
                        Categories:{' '}
                      </span>
                      {recipe.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-right text-gray-500 mt-4">
                    Created by User ID: {recipe.userId}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
