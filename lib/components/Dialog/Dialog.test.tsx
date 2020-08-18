import '@testing-library/jest-dom/extend-expect';
import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BraidTestProvider, Dialog } from '..';
import { Button } from '../Button/Button';

const ESCAPE = 27;
const CLOSE_BUTTON_LABEL = 'Close dialog please';

const TestCase = ({ close }: { close: (newOpenState: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button data={{ testid: 'buttonBefore' }} onClick={() => setOpen(true)}>
        Before
      </Button>
      <input type="text" />
      <Dialog
        title="Test Dialog"
        closeLabel={CLOSE_BUTTON_LABEL}
        open={open}
        onClose={(newOpenState) => {
          setOpen(newOpenState);
          close(newOpenState);
        }}
      >
        <Button data={{ testid: 'buttonInside' }}>Inside</Button>
      </Dialog>
      <Button data={{ testid: 'buttonAfter' }}>After</Button>
      <section>
        <article>
          <input type="text" />
        </article>
      </section>
    </div>
  );
};

function renderDialog() {
  const closeHandler = jest.fn();

  return {
    ...render(
      <BraidTestProvider>
        <TestCase close={closeHandler} />
      </BraidTestProvider>,
    ),
    closeHandler,
  };
}

describe('Dialog', () => {
  it('should not focus content when closed', () => {
    const { getByTestId } = renderDialog();

    expect(document.body).toHaveFocus();
    userEvent.tab();
    expect(getByTestId('buttonBefore')).toHaveFocus();
    userEvent.tab();
    userEvent.tab();
    expect(getByTestId('buttonAfter')).toHaveFocus();
    userEvent.tab();
    userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('should not be visible until open', () => {
    const { getByTestId, queryByRole } = renderDialog();

    expect(queryByRole('dialog')).not.toBeInTheDocument();

    userEvent.click(getByTestId('buttonBefore'));

    expect(queryByRole('dialog')).toBeVisible();
  });

  it('should have the correct aria properties when open', () => {
    const { getByTestId, queryByRole } = renderDialog();

    expect(queryByRole('dialog')).not.toBeInTheDocument();

    userEvent.click(getByTestId('buttonBefore'));

    const dialog = queryByRole('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Test Dialog');
  });

  it('should focus the first focusable element', () => {
    const { getByTestId } = renderDialog();

    userEvent.click(getByTestId('buttonBefore'));

    expect(getByTestId('buttonInside')).toHaveFocus();
  });

  it('should trap focus in the dialog', () => {
    const { getByTestId, getByRole, getByLabelText } = renderDialog();

    const dialogOpenButton = getByTestId('buttonBefore');
    userEvent.tab();
    expect(dialogOpenButton).toHaveFocus();

    userEvent.click(dialogOpenButton);
    const buttonInside = getByTestId('buttonInside');
    const closeButton = getByLabelText(CLOSE_BUTTON_LABEL);

    expect(buttonInside).toHaveFocus();

    userEvent.tab({ focusTrap: getByRole('dialog') });
    expect(closeButton).toHaveFocus();

    userEvent.tab({ focusTrap: getByRole('dialog') });
    expect(buttonInside).toHaveFocus();

    userEvent.tab({ shift: true, focusTrap: getByRole('dialog') });
    expect(closeButton).toHaveFocus();

    userEvent.tab({ shift: true, focusTrap: getByRole('dialog') });
    expect(buttonInside).toHaveFocus();
  });

  it('should close when hitting escape', () => {
    const { getByTestId, queryByRole, getByRole } = renderDialog();

    const dialogOpenButton = getByTestId('buttonBefore');
    userEvent.click(dialogOpenButton);
    fireEvent.keyDown(getByRole('dialog'), { keyCode: ESCAPE });

    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should hide document content outside of dialog from screen readers when open', async () => {
    const { getByTestId, queryAllByRole } = renderDialog();

    expect(queryAllByRole('textbox').length).toBe(2);

    const dialogOpenButton = getByTestId('buttonBefore');
    userEvent.click(dialogOpenButton);

    expect(queryAllByRole('textbox').length).toBe(0);
  });

  it('should call dismiss handler once on close', async () => {
    const { getByTestId, getByLabelText, closeHandler } = renderDialog();

    expect(closeHandler).not.toHaveBeenCalled();

    const dialogOpenButton = getByTestId('buttonBefore');
    userEvent.click(dialogOpenButton);
    const closeButton = getByLabelText(CLOSE_BUTTON_LABEL);
    userEvent.click(closeButton);

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler).toHaveBeenCalledWith(false);
  });
});