import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('recipes',Path(__file__).resolve().parents[1]/'scripts/sync_recipes.py')
recipes=importlib.util.module_from_spec(spec);spec.loader.exec_module(recipes)
class RecipeTests(unittest.TestCase):
    def test_normalizes_optional_fields_and_drops_empty_ingredients(self):
        value=recipes.recipe({'idMeal':'123','strMeal':' Example ','strInstructions':'Cook.','strIngredient1':' tomato ','strMeasure1':None,'strIngredient2':'','strMealThumb':'https://evil.example/photo.jpg'})
        self.assertEqual(value['name'],'Example');self.assertEqual(value['ingredients'],[{'name':'tomato','measure':''}]);self.assertIsNone(value['image'])
    def test_invalid_recipe_not_published(self):
        self.assertIsNone(recipes.recipe({'idMeal':'bad','strMeal':'Example','strInstructions':'Cook.'}))
    def test_private_api_paths_and_script_urls_not_published(self):
        self.assertIsNone(recipes.safe_url('https://www.themealdb.com/api/json/v1/private/search.php'))
        self.assertIsNone(recipes.safe_url('javascript:alert(1)'))
    def test_official_recipe_image_allowed(self):
        url='https://www.themealdb.com/images/media/meals/example.jpg'
        self.assertEqual(recipes.safe_url(url,True),url)
if __name__=='__main__':unittest.main()
