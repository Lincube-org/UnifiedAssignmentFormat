'use strict';

const cardDialog = document.getElementById('card-dialog');
const cardDialogTitle = document.getElementById('card-dialog-title');
const cardDialogBody = document.getElementById('card-dialog-body');
const experienceDialog = document.getElementById('experience-dialog');
const applyForm = document.getElementById('apply-form');
const applyReceipt = document.getElementById('apply-receipt');
const errorSummary = document.getElementById('form-errors');
const errorList = document.getElementById('form-error-list');

const detailConfig = {
  brand: {
    title: '表与里，在同一份文件里',
    template: 'tpl-brand'
  },
  value: {
    title: '老师、家长、平台，各读各的',
    template: 'tpl-value'
  },
  devices: {
    title: '能打开 PDF，就能看见作业',
    template: 'tpl-devices'
  },
  story: {
    title: '一张卡片，如何变成一条记录',
    template: 'tpl-story'
  },
  product: {
    title: '一个开放格式，三种交付形态',
    template: 'tpl-product'
  }
};

const roleLabels = {
  teacher: '老师',
  family: '学生与家长',
  platform: '平台与系统'
};

const fields = {
  name: document.getElementById('apply-name'),
  role: document.getElementById('apply-role'),
  email: document.getElementById('apply-email'),
  consent: document.getElementById('apply-consent')
};
const interestField = document.getElementById('apply-interest');
const receiptFields = {
  name: document.getElementById('receipt-name'),
  role: document.getElementById('receipt-role'),
  email: document.getElementById('receipt-email'),
  interest: document.getElementById('receipt-interest')
};
const styleStage = document.getElementById('style-stage');
const styleStatus = document.getElementById('style-status');
const styleButtons = [...document.querySelectorAll('.style-picker__buttons [data-style]')];
const styleMeta = {
  default: { name: '粉纸' },
  warm: { name: '暖纸' },
  mint: { name: '薄荷' },
  ink: { name: '墨色' }
};

let cardDialogTrigger = null;
let experienceTrigger = null;
let goToStyles = false;

function focusWithoutScroll(element) {
  if (element && typeof element.focus === 'function') {
    element.focus({ preventScroll: true });
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setStyle(name, announce = true) {
  if (!styleStage || !styleMeta[name]) {
    return;
  }

  styleStage.dataset.style = name;
  styleButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.style === name));
  });

  if (announce && styleStatus) {
    styleStatus.textContent = `已切换至${styleMeta[name].name}样式`;
  }
}

function activateRole(role, announce = true) {
  const buttons = cardDialogBody.querySelectorAll('[data-role]');
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.role === role));
  });

  ['teacher', 'family', 'platform'].forEach((key) => {
    const panel = cardDialogBody.querySelector(`#role-panel-${key}`);
    if (panel) {
      panel.hidden = key !== role;
    }
  });

  const status = cardDialogBody.querySelector('#role-status');
  if (status && announce) {
    status.textContent = `已显示：${roleLabels[role] || role}视角`;
  }
}

function openCardDialog(trigger) {
  const detail = detailConfig[trigger.dataset.detail];
  if (!detail || cardDialog.open) {
    return;
  }

  const template = document.getElementById(detail.template);
  if (!template) {
    return;
  }

  cardDialogTrigger = trigger;
  cardDialogTitle.textContent = detail.title;
  cardDialogBody.replaceChildren(template.content.cloneNode(true));
  cardDialogBody.scrollTop = 0;

  if (trigger.dataset.detail === 'value') {
    activateRole('teacher', false);
  }

  cardDialog.showModal();
  cardDialogTitle.focus();
}

function openExperience(trigger) {
  if (experienceDialog.open) {
    return;
  }

  experienceTrigger = trigger;
  resetExperience();
  experienceDialog.showModal();
  document.getElementById('experience-title').focus();
}

function clearErrors() {
  errorSummary.hidden = true;
  errorList.replaceChildren();

  Object.values(fields).forEach((field) => {
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
    field.setAttribute('aria-invalid', 'false');
  });
}

function clearFieldError(field) {
  if (!field || !field.id) {
    return;
  }

  const error = document.getElementById(`${field.id}-error`);
  if (error) {
    error.hidden = true;
    error.textContent = '';
  }

  if (field.hasAttribute('aria-invalid')) {
    field.setAttribute('aria-invalid', 'false');
  }

  const item = errorList.querySelector(`[data-error-for="${field.id}"]`);
  if (item) {
    item.remove();
  }

  if (!errorList.querySelector('li')) {
    errorSummary.hidden = true;
  }
}

function validateForm() {
  const errors = [];
  const name = fields.name.value.trim();
  const email = fields.email.value.trim();

  if (!name) {
    errors.push({ field: fields.name, label: '称呼', message: '请填写你的称呼。' });
  } else if (name.length > 40) {
    errors.push({ field: fields.name, label: '称呼', message: '称呼请控制在 40 个字符以内。' });
  }

  if (!fields.role.value) {
    errors.push({ field: fields.role, label: '身份', message: '请选择你的身份。' });
  }

  if (!email) {
    errors.push({ field: fields.email, label: '联系邮箱', message: '请填写联系邮箱。' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: fields.email, label: '联系邮箱', message: '邮箱格式不完整。' });
  }

  if (!fields.consent.checked) {
    errors.push({ field: fields.consent, label: '确认', message: '请先确认你了解这是本地演示。' });
  }

  return errors;
}

function showErrors(errors) {
  errorList.replaceChildren();

  errors.forEach(({ field, label, message }) => {
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }

    field.setAttribute('aria-invalid', 'true');

    const item = document.createElement('li');
    item.dataset.errorFor = field.id;
    const link = document.createElement('a');
    link.href = `#${field.id}`;
    link.textContent = `${label}：${message}`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      field.focus();
    });
    item.append(link);
    errorList.append(item);
  });

  errorSummary.hidden = false;
  errorSummary.focus();
}

function showReceipt() {
  receiptFields.name.textContent = fields.name.value.trim();
  receiptFields.role.textContent = fields.role.options[fields.role.selectedIndex]?.text || '';
  receiptFields.email.textContent = fields.email.value.trim();
  receiptFields.interest.textContent = interestField.value
    ? interestField.options[interestField.selectedIndex]?.text || ''
    : '未选择';

  applyForm.hidden = true;
  applyReceipt.hidden = false;
  applyReceipt.focus();
}

function resetExperience() {
  applyForm.reset();
  clearErrors();
  applyForm.hidden = false;
  applyReceipt.hidden = true;

  Object.values(receiptFields).forEach((element) => {
    element.textContent = '';
  });
}

document.querySelectorAll('[data-detail]').forEach((trigger) => {
  trigger.addEventListener('click', () => openCardDialog(trigger));
});

document.querySelectorAll('[data-open-experience]').forEach((trigger) => {
  trigger.addEventListener('click', () => openExperience(trigger));
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = button.closest('dialog');
    if (dialog && dialog.open) {
      dialog.close();
    }
  });
});

[cardDialog, experienceDialog].forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

cardDialog.addEventListener('close', () => {
  cardDialogBody.replaceChildren();
  const trigger = cardDialogTrigger;
  cardDialogTrigger = null;

  if (goToStyles) {
    goToStyles = false;
    const styles = document.getElementById('styles');
    const title = document.getElementById('styles-title');
    if (title) {
      title.focus({ preventScroll: true });
    }
    if (styles) {
      styles.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }
    return;
  }

  focusWithoutScroll(trigger);
});

experienceDialog.addEventListener('close', () => {
  const trigger = experienceTrigger;
  experienceTrigger = null;
  focusWithoutScroll(trigger);
});

cardDialogBody.addEventListener('click', (event) => {
  const styleButton = event.target.closest('[data-go-styles]');
  if (styleButton && cardDialogBody.contains(styleButton)) {
    goToStyles = true;
    cardDialog.close();
    return;
  }

  const button = event.target.closest('[data-role]');
  if (!button || !cardDialogBody.contains(button)) {
    return;
  }
  activateRole(button.dataset.role);
});

styleButtons.forEach((button) => {
  button.addEventListener('click', () => setStyle(button.dataset.style));
});
setStyle('default', false);

function handleApplySubmit(event) {
  if (event) {
    event.preventDefault();
  }

  clearErrors();

  const errors = validateForm();
  if (errors.length) {
    showErrors(errors);
    return;
  }

  showReceipt();
}

applyForm.addEventListener('submit', handleApplySubmit);
document.getElementById('apply-submit').addEventListener('click', handleApplySubmit);

applyForm.addEventListener('input', (event) => {
  clearFieldError(event.target);
});

applyForm.addEventListener('change', (event) => {
  clearFieldError(event.target);
});

document.querySelector('[data-edit-form]').addEventListener('click', () => {
  applyReceipt.hidden = true;
  applyForm.hidden = false;
  clearErrors();
  fields.name.focus();
});
