import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Alert } from './Alert.tsx';
import { Button } from './Button.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { handleDialogKey } from './dialogFocus.ts';
import { Field } from './Field.tsx';
import { SampleSite } from '../project/SampleSite.tsx';
import { StatusLabel } from './StatusLabel.tsx';

function markup(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function keyEvent(key: string, shiftKey = false) {
  return {
    key,
    shiftKey,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
}

describe('Button', () => {
  it('is a native button, so Enter and Space activate it', () => {
    const html = markup(
      createElement(Button, { onClick() {}, children: 'Сбросить' }),
    );
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('Сбросить');
    expect(html).not.toContain('tabindex="-1"');
  });

  it('can submit a form and can be disabled', () => {
    expect(
      markup(
        createElement(Button, {
          type: 'submit',
          children: 'Проверить архив',
        }),
      ),
    ).toContain('type="submit"');
    expect(
      markup(
        createElement(Button, {
          disabled: true,
          children: 'Вернуть версию A',
        }),
      ),
    ).toContain('disabled');
  });
});

describe('Field', () => {
  it('points aria-describedby at the error and marks the field invalid', () => {
    const html = markup(
      createElement(Field, {
        label: 'Домен',
        name: 'domain',
        value: '',
        onChange() {},
        error: 'Укажите домен.',
        required: true,
      }),
    );
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    const inputId = /<input[^>]*\sid="([^"]+)"/.exec(html)?.[1];

    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain('Укажите домен.');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('required');
    expect(html).toContain(' *');
    expect(html).toContain(`for="${inputId}"`);
    expect(html).toContain('value=""');
  });

  it('omits the error link when the value is only empty', () => {
    const html = markup(
      createElement(Field, {
        label: 'Домен',
        name: 'domain',
        value: '',
        onChange() {},
      }),
    );
    expect(html).not.toContain('aria-describedby');
    expect(html).not.toContain('aria-invalid');
    expect(html).not.toContain('required');
  });
});

describe('Alert', () => {
  it('exposes an error as an alert and a warning as a status', () => {
    const error = markup(
      createElement(Alert, { children: 'Публикация не прошла.' }),
    );
    const warn = markup(
      createElement(Alert, {
        tone: 'warn',
        children: 'Запись ещё не видна.',
      }),
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain('Публикация не прошла.');
    expect(warn).toContain('role="status"');
    expect(warn).toContain('Запись ещё не видна.');
    expect(warn).not.toContain('role="alert"');
  });
});

describe('StatusLabel', () => {
  it('uses the domain words and skips notStarted', () => {
    expect(markup(createElement(StatusLabel, { status: 'pending' }))).toContain(
      'Ожидание',
    );
    expect(markup(createElement(StatusLabel, { status: 'active' }))).toContain(
      'Активен',
    );
    expect(markup(createElement(StatusLabel, { status: 'failed' }))).toContain(
      'Ошибка',
    );
    expect(
      markup(createElement(StatusLabel, { status: 'deferred' })),
    ).toContain('Недоступно в этой версии прототипа');
    expect(markup(createElement(StatusLabel, { status: 'notStarted' }))).toBe(
      '',
    );
  });
});

describe('ConfirmDialog', () => {
  it('names the dialog and offers cancel and confirm as buttons', () => {
    const html = markup(
      createElement(ConfirmDialog, {
        title: 'Опубликовать версию B',
        confirmLabel: 'Опубликовать версию B',
        onConfirm() {},
        onClose() {},
        children: 'Активной станет версия B.',
      }),
    );
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain('Опубликовать версию B');
    expect(html).toContain('Отмена');
    expect(html).toContain('Активной станет версия B.');
    expect(html.match(/<button/g)).toHaveLength(2);
  });
});

describe('handleDialogKey', () => {
  it('closes on Escape', () => {
    const event = keyEvent('Escape');
    let closed = false;
    handleDialogKey(event, [{ focus() {} }], 0, () => {
      closed = true;
    });
    expect(event.prevented).toBe(true);
    expect(closed).toBe(true);
  });

  it('cycles Tab from the last control back to the first', () => {
    const focused: string[] = [];
    const items = [
      {
        focus() {
          focused.push('cancel');
        },
      },
      {
        focus() {
          focused.push('confirm');
        },
      },
    ];
    const event = keyEvent('Tab');
    handleDialogKey(event, items, 1, () => {});
    expect(event.prevented).toBe(true);
    expect(focused).toEqual(['cancel']);
  });

  it('cycles Shift+Tab from the first control to the last', () => {
    const focused: string[] = [];
    const items = [
      {
        focus() {
          focused.push('cancel');
        },
      },
      {
        focus() {
          focused.push('confirm');
        },
      },
    ];
    const event = keyEvent('Tab', true);
    handleDialogKey(event, items, 0, () => {});
    expect(focused).toEqual(['confirm']);
  });

  it('moves Tab forward and leaves Enter to the focused button', () => {
    const focused: string[] = [];
    const items = [
      {
        focus() {
          focused.push('cancel');
        },
      },
      {
        focus() {
          focused.push('confirm');
        },
      },
    ];
    const tab = keyEvent('Tab');
    handleDialogKey(tab, items, 0, () => {});
    expect(focused).toEqual(['confirm']);

    const enter = keyEvent('Enter');
    let closed = false;
    handleDialogKey(enter, items, 1, () => {
      closed = true;
    });
    expect(enter.prevented).toBe(false);
    expect(closed).toBe(false);
    expect(focused).toEqual(['confirm']);
  });

  it('sends a Tab from outside the controls to the edge', () => {
    const focused: string[] = [];
    const items = [
      {
        focus() {
          focused.push('cancel');
        },
      },
      {
        focus() {
          focused.push('confirm');
        },
      },
    ];
    handleDialogKey(keyEvent('Tab'), items, -1, () => {});
    handleDialogKey(keyEvent('Tab', true), items, -1, () => {});
    expect(focused).toEqual(['cancel', 'confirm']);
  });

  it('keeps Tab inside when the dialog has no controls yet', () => {
    const event = keyEvent('Tab');
    handleDialogKey(event, [], -1, () => {});
    expect(event.prevented).toBe(true);
  });
});

describe('SampleSite', () => {
  it('renders the html in a locked-down iframe', () => {
    const html = markup(
      createElement(SampleSite, {
        html: '<p>Баурсак, 500 ₸</p>',
      }),
    );
    expect(html).toContain('<iframe');
    expect(html).toContain('sandbox=""');
    expect(html).toContain('srcDoc=');
    expect(html).toContain('Баурсак, 500 ₸');
    expect(html).toContain('title="Страница сайта"');
    expect(html).not.toContain('allow-scripts');
    expect(html).not.toContain('allow-same-origin');
  });
});
