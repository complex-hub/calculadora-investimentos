import type { Investment } from '../types';
import { formatInvestmentType } from '../utils/formatting';
import { formatDate } from '../utils/dates';

/**
 * Renders the list of investments in the sidebar/list container.
 */
export function renderInvestmentList(
  investments: Investment[],
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

  // Render each investment
  investments.forEach(investment => {
    const item = createInvestmentListItem(investment, onEdit, onRemove);
    listElement.appendChild(item);
  });

  console.log(`Rendered ${investments.length} investments`);
}

/**
 * Creates a list item element for an investment.
 */
function createInvestmentListItem(
  investment: Investment,
  onEdit: (id: string) => void,
  onRemove: (id: string) => void
): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'investment-item';
  li.dataset.id = investment.id;

  const rateDisplay = formatInvestmentType(investment.type, investment.rate);
  const dueDateDisplay = investment.dueDate 
    ? formatDate(investment.dueDate) 
    : 'Sem vencimento';
  const taxDisplay = investment.isTaxed ? 'Com IR' : 'Isento';

  li.innerHTML = `
    <div class="investment-item-info">
      <span class="investment-item-name">${escapeHtml(investment.name)}</span>
      <span class="investment-item-details">
        ${rateDisplay} · ${dueDateDisplay} · ${taxDisplay}
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