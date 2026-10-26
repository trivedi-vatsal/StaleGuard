import { recipes } from "../recipes";

type RecipePickerProps = {
  current?: string;
};

export function RecipePicker({ current }: RecipePickerProps) {
  return (
    <nav className="recipe-picker" aria-label="Implementation recipes">
      <p className="recipe-picker-label">Choose a recipe</p>
      <div className="recipe-picker-grid">
        {recipes.map((recipe) => (
          <a
            key={recipe.path}
            href={`#${recipe.path}`}
            className={`recipe-card${current === recipe.path ? " active" : ""}`}
            aria-current={current === recipe.path ? "page" : undefined}
          >
            <span className="recipe-card-tag">{recipe.shortLabel}</span>
            <span className="recipe-card-title">{recipe.label}</span>
            <p className="recipe-card-desc">{recipe.description}</p>
          </a>
        ))}
      </div>
    </nav>
  );
}
