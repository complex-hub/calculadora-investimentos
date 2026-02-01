import type { Investment, GlobalRates } from '../types';
import { formatInvestmentType } from '../utils/formatting';
import { formatDate } from '../utils/dates';
import { calculateEquivalentRates } from '../calculations';

/**
 * Renders the list of investments in the sidebar/list container.
 */
export function renderInvestmentList(
  investments: Investment[],
  rates: GlobalRates,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void
): void {
  const listElement = document.getElementById('investment-list');
  
  if (!listElement) {
    console.error('Investment list element not found');
    return;
  }

  // Clear existing content
  listElement.innerHTML = '';

  if (investments.length === 0) {
    listElement.innerHTML = `
      <li class="investment-item-empty">
        Nenhum investimento adicionado ainda.
      </li>
    `;
    return;
  }

  // Render each investment with color index
  investments.forEach((investment, index) => {
    const item = createInvestmentListItem(investment, rates, index, onEdit, onRemove);
    listElement.appendChild(item);
  });

  console.log(`Rendered ${investments.length} investments`);
}

/**
 * Creates a list item element for an investment.
 */
function createInvestmentListItem(
  investment: Investment,
  rates: GlobalRates,
  colorIndex: number,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void
): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'investment-item';
  li.dataset.id = investment.id;
  li.dataset.color = String(colorIndex % 10); // For CSS color indicator

  const rateDisplay = formatInvestmentType(investment.type, investment.rate);
  const dueDateDisplay = investment.dueDate 
    ? formatDate(investment.dueDate) 
    : 'Sem vencimento';
  const taxDisplay = investment.isTaxed ? 'Com IR' : 'Isento';

  // Calculate returns for display
  const equivalentRates = calculateEquivalentRates(investment, rates);
  const netReturn1Y = (equivalentRates.net365Days * 100).toFixed(2);

  li.innerHTML = `
    <div class="investment-item-info">
      <span class="investment-item-name">${escapeHtml(investment.name)}</span>
      <span class="investment-item-details">
        ${rateDisplay} · ${taxDisplay}
      </span>
      <span class="investment-item-return">
        Rend. líquido 1 ano: <strong>${netReturn1Y}%</strong>
      </span>
    </div>
    <div class="investment-item-actions">
      <button type="button" class="btn-icon btn-edit" title="Editar">
        ✏️
      </button>
      <button type="button" class="btn-icon btn-remove" title="Remover">
        🗑️
      </button>
    </div>
  `;

  // Add event listeners
  const editBtn = li.querySelector('.btn-edit') as HTMLButtonElement;
  const removeBtn = li.querySelector('.btn-remove') as HTMLButtonElement;

  editBtn.addEventListener('click', () => {
    console.log('Edit clicked for:', investment.id);
    onEdit(investment.id);
  });

  removeBtn.addEventListener('click', () => {
    console.log('Remove clicked for:', investment.id);
    if (confirm(`Remover "${investment.name}"?`)) {
      onRemove(investment.id);
    }
  });

  return li;
}

/**
 * Formats investment details for display.
 */
export function formatInvestmentSummary(investment: Investment): string {
  const rateDisplay = formatInvestmentType(investment.type, investment.rate);
  const dueDateDisplay = investment.dueDate 
    ? formatDate(investment.dueDate) 
    : 'Sem vencimento';
  
  return `${investment.name} - ${rateDisplay} (${dueDateDisplay})`;
}

/**
 * Escapes HTML to prevent XSS.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}