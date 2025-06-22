// src/app/recipes/[recipeId]/page.tsx
import {doc, getDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {notFound} from 'next/navigation'; // For handling 404
import Image from 'next/image';

// Define the Recipe interface again for consistency, matching stored data
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string; // Document ID
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number; // in minutes
  servings: number;
  userId: string;
  imageUrl?: string;
  categories?: string[];
  createdAt?: {
    toDate: () => Date; // Represents a Firestore Timestamp object's toDate method
  };
}

// Next.js convention for dynamic routes: props contain 'params'
interface RecipeDetailPageProps {
  params: {
    recipeId: string;
  };
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const {recipeId} = params;

  // Fetch data directly in the Server Component
  const docRef = doc(db, 'recipes', recipeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    notFound(); // Triggers Next.js's not-found page or a custom 404
  }

  // Get data and apply defaults, similar to how we did in RecipesPage
  const data = docSnap.data();
  const recipe: Recipe = {
    id: docSnap.id,
    name: data?.name || 'Untitled Recipe',
    ingredients: (data?.ingredients || []) as Ingredient[],
    instructions: (data?.instructions || []) as string[],
    cookingTime: data?.cookingTime ?? 0,
    servings: data?.servings ?? 0,
    userId: data?.userId || 'unknown',
    imageUrl: data?.imageUrl || '',
    categories: (data?.categories || []) as string[],
    createdAt: data?.createdAt || undefined, // Keep as Timestamp object for now, convert in render if needed
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {recipe.imageUrl && (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {recipe.name}
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Servings: <span className="font-semibold">{recipe.servings}</span> |
            Cook Time:{' '}
            <span className="font-semibold">{recipe.cookingTime}</span> minutes
            {recipe.createdAt && (
              <span className="block mt-2 text-sm text-gray-500">
                Added on: {recipe.createdAt.toDate().toLocaleDateString()}
              </span>
            )}
          </p>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Ingredients:
            </h2>
            {recipe.ingredients.length === 0 ? (
              <p className="text-gray-500">No ingredients listed.</p>
            ) : (
              <ul className="list-disc list-inside text-gray-700 text-lg space-y-1">
                {recipe.ingredients.map((ing, index) => (
                  <li key={index}>
                    <span className="font-medium">
                      {ing.quantity} {ing.unit}
                    </span>{' '}
                    {ing.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Instructions:
            </h2>
            {recipe.instructions.length === 0 ? (
              <p className="text-gray-500">No instructions provided.</p>
            ) : (
              <ol className="list-decimal list-inside text-gray-700 text-lg space-y-2">
                {recipe.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
          </div>

          {recipe.categories && recipe.categories.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Categories:
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-8">
            Created by User ID: {recipe.userId}
          </p>
        </div>
      </div>
    </div>
  );
}
