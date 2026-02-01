import type { Investment, InvestmentType } from '../types';
import { getInvestmentTypeInfo } from '../constants';
import { parseRateInput, generateId } from '../utils/formatting';
import { parseInputDate, isValidDueDate } from '../utils/dates';

// ===== DOM Element References =====

function getFormElements() {
  return {
    form: document.getElementById('investment-form') as HTMLFormElement,
    nameInput: document.getElementById('investment-name') as HTMLInputElement,
    typeSelect: document.getElementById('investment-type') as HTMLSelectElement,
    rateInput: document.getElementById('investment-rate') as HTMLInputElement,
    rateLabel: document.getElementById('rate-label') as HTMLSpanElement,
    taxedCheckbox: document.getElementById('investment-taxed') as HTMLInputElement,
    taxToggleGroup: document.getElementById('tax-toggle-group') as HTMLDivElement,
    dueDateInput: document.getElementById('investment-due-date') as HTMLInputElement,
    noDueDateCheckbox: document.getElementById('investment-no-due-date') as HTMLInputElement,
    submitBtn: document.getElementById('form-submit-btn') as HTMLButtonElement,
  };
}

// ===== Form State =====

let currentEditingId: string | null = null;

// ===== Validation =====

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateForm(): ValidationResult {
  const elements = getFormElements();
  const errors: string[] = [];

  // Name validation
  const name = elements.nameInput.value.trim();
  if (!name) {
    errors.push('Nome do investimento é obrigatório');
  }

  // Rate validation
  const rate = parseRateInput(elements.rateInput.value);
  if (rate === null) {
    errors.push('Taxa inválida');
  } else if (rate <= 0) {
    errors.push('Taxa deve ser maior que zero');
  }

  // Due date validation
  const noDueDate = elements.noDueDateCheckbox.checked;
  if (!noDueDate) {
    const dueDate = parseInputDate(elements.dueDateInput.value);
    if (!dueDate) {
      errors.push('Data de vencimento inválida');
    } else if (!isValidDueDate(dueDate)) {
      errors.push('Data de vencimento deve ser no futuro');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===== Read Form Values =====

/**
 * Reads current form values and returns an Investment object.
 * Returns null if validation fails.
 */
export function readFormValues(): Investment | null {
  const validation = validateForm();
  
  if (!validation.valid) {
    console.warn('Form validation failed:', validation.errors);
    alert(validation.errors.join('\n'));
    return null;
  }

  const elements = getFormElements();
  const typeInfo = getInvestmentTypeInfo(elements.typeSelect.value);

  const investment: Investment = {
    id: currentEditingId || generateId(),
    name: elements.nameInput.value.trim(),
    type: elements.typeSelect.value as InvestmentType,
    rate: parseRateInput(elements.rateInput.value)!,
    isTaxed: typeInfo?.alwaysTaxed ? true : elements.taxedCheckbox.checked,
    dueDate: elements.noDueDateCheckbox.checked 
      ? null 
      : parseInputDate(elements.dueDateInput.value),
    createdAt: currentEditingId ? new Date() : new Date(), // Keep original if editing
  };

  return investment;
}

// ===== Populate Form (for editing) =====

/**
 * Populates form fields with an existing investment (for editing).
 */
export function populateForm(investment: Investment): void {
  const elements = getFormElements();

  currentEditingId = investment.id;

  elements.nameInput.value = investment.name;
  elements.typeSelect.value = investment.type;
  elements.rateInput.value = investment.rate.toString().replace('.', ',');
  elements.taxedCheckbox.checked = investment.isTaxed;
  
  if (investment.dueDate) {
    elements.noDueDateCheckbox.checked = false;
    elements.dueDateInput.value = investment.dueDate.toISOString().split('T')[0];
    elements.dueDateInput.disabled = false;
  } else {
    elements.noDueDateCheckbox.checked = true;
    elements.dueDateInput.value = '';
    elements.dueDateInput.disabled = true;
  }

  // Update UI for investment type
  updateFormForType(investment.type);

  // Update button text
  elements.submitBtn.textContent = 'Atualizar investimento';

  // Focus the name field
  elements.nameInput.focus();
}

// ===== Reset Form =====

/**
 * Resets form to default empty state.
 */
export function resetForm(): void {
  const elements = getFormElements();

  currentEditingId = null;

  elements.form.reset();
  elements.typeSelect.value = 'cdi-percent';
  elements.taxedCheckbox.checked = true;
  elements.noDueDateCheckbox.checked = false;
  elements.dueDateInput.disabled = false;
  
  // Reset to default type UI
  updateFormForType('cdi-percent');

  // Reset button text
  elements.submitBtn.textContent = 'Adicionar ao gráfico';
}

// ===== Update Form Based on Type =====

/**
 * Updates form visibility and labels based on investment type.
 */
function updateFormForType(type: InvestmentType | string): void {
  const elements = getFormElements();
  const typeInfo = getInvestmentTypeInfo(type);

  if (!typeInfo) return;

  // Update rate label and placeholder
  elements.rateLabel.textContent = typeInfo.rateLabel;
  elements.rateInput.placeholder = typeInfo.ratePlaceholder;

  // Show/hide tax toggle
  if (typeInfo.alwaysTaxed) {
    elements.taxToggleGroup.classList.add('hidden');
    elements.taxedCheckbox.checked = true;
  } else {
    elements.taxToggleGroup.classList.remove('hidden');
  }
}

// ===== Initialize Form Handlers =====

/**
 * Sets up event listeners for form interactions.
 */
export function initializeFormHandlers(
  onSubmit: (investment: Investment) => void
): void {
  const elements = getFormElements();

  // Form submission
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const investment = readFormValues();
    
    if (investment) {
      console.log('Form submitted:', investment);
      onSubmit(investment);
      resetForm();
    }
  });

  // Type change handler
  elements.typeSelect.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    updateFormForType(target.value);
    console.log('Investment type changed to:', target.value);
  });

  // No due date toggle
  elements.noDueDateCheckbox.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    elements.dueDateInput.disabled = target.checked;
    
    if (target.checked) {
      elements.dueDateInput.value = '';
    }
    
    console.log('No due date:', target.checked);
  });

  // Initialize with default type
  updateFormForType(elements.typeSelect.value);

  console.log('Form handlers initialized');
}

/**
 * Returns whether we're currently editing an investment.
 */
export function isEditing(): boolean {
  return currentEditingId !== null;
}

/**
 * Gets the ID of the investment being edited.
 */
export function getEditingId(): string | null {
  return currentEditingId;
}

/**
 * Cancels the current edit operation.
 */
export function cancelEdit(): void {
  resetForm();
}