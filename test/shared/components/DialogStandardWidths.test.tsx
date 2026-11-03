/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 *
 * Copyright (C) 2025 yaLLMa3
 *
 * This Source Code Form is subject to the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 *
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import UserPromptDialog from '@/modules/flow/components/UserPromptDialog';
import ToolSelectionPopup from '@/shared/components/ToolSelectionPopup';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: 'en' },
  }),
}));

describe('Standardized Dialog Width Architecture & Scrollbars', () => {
  describe('Dialog Width Classes in Components', () => {
    it('DeleteConfirmationDialog uses dialog-sm and max-w-md (Tier 1)', () => {
      const { container } = render(
        <DeleteConfirmationDialog
          isOpen={true}
          itemType="workflow"
          itemName="Test Flow"
          deleteCompletely={false}
          onDeleteCompletelyChange={vi.fn()}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const dialogPanel = container.querySelector('.dialog-sm');
      expect(dialogPanel).toBeInTheDocument();
      expect(dialogPanel?.className).toContain('max-w-md');
      expect(dialogPanel?.className).not.toContain('max-w-lg');
    });

    it('ConfirmationDialog uses dialog-sm and max-w-md (Tier 1)', () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialogPanel = container.querySelector('.dialog-sm');
      expect(dialogPanel).toBeInTheDocument();
      expect(dialogPanel?.className).toContain('max-w-md');
    });

    it('UserPromptDialog uses dialog-md and max-w-lg without inline 580px (Tier 2)', () => {
      const { container } = render(
        <UserPromptDialog
          isOpen={true}
          promptId="prompt-1"
          nodeId={1}
          nodeTitle="Test Node"
          message="Please provide input:"
          onSubmit={vi.fn()}
          onClose={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialogPanel = container.querySelector('.dialog-md');
      expect(dialogPanel).toBeInTheDocument();
      expect(dialogPanel?.className).toContain('max-w-lg');
      // Verify inline maxWidth 580px is removed
      expect((dialogPanel as HTMLElement)?.style.maxWidth).toBe('');
    });

    it('ToolSelectionPopup uses dialog-md and max-w-lg (Tier 2)', () => {
      const { container } = render(
        <ToolSelectionPopup
          isOpen={true}
          onClose={vi.fn()}
          onAddTool={vi.fn()}
          handleImportWorkflow={vi.fn()}
          availableTools={[]}
          existingTools={[]}
        />
      );

      const dialogPanel = container.querySelector('.dialog-md');
      expect(dialogPanel).toBeInTheDocument();
      expect(dialogPanel?.className).toContain('max-w-lg');
    });
  });

  describe('CSS Scrollbar & Dialog Width Definitions', () => {
    it('src/index.css defines 4 standard dialog tiers and unified scrollbars', () => {
      const indexCssPath = path.resolve(__dirname, '../../../src/index.css');
      const cssContent = fs.readFileSync(indexCssPath, 'utf-8');

      expect(cssContent).toContain('.dialog-sm');
      expect(cssContent).toContain('.dialog-md');
      expect(cssContent).toContain('.dialog-lg');
      expect(cssContent).toContain('.dialog-xl');

      // Console scrollbar matches gold brand scrollbar
      expect(cssContent).toContain('.console-scrollbar');
      expect(cssContent).toContain('#FFC72C');
      expect(cssContent).toContain('#EBB200');
    });

    it('src/app/App.css defines global scrollbars with gold styling and Firefox support', () => {
      const appCssPath = path.resolve(__dirname, '../../../src/app/App.css');
      const cssContent = fs.readFileSync(appCssPath, 'utf-8');

      expect(cssContent).toContain('scrollbar-color: #FFC72C');
      expect(cssContent).toContain('::-webkit-scrollbar');
      expect(cssContent).toContain('#FFC72C');
      expect(cssContent).toContain('#EBB200');
    });
  });
});
