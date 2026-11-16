import { ActiveScreenPrintService } from '../services/active-screen-print.service';
import { ActiveScreenSaveService } from '../services/active-screen-save.service';
import { ActiveScreenSearchService } from '../services/active-screen-search.service';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

export interface ListScreenShortcutActions {
  refresh?: () => void;
  create?: () => void;
  focusSearch?: () => void;
}

export interface DetailScreenShortcutActions {
  save: () => void;
  delete?: () => void;
  cancel?: () => void;
  print?: () => void;
}

export interface ShortcutBinding {
  unregister: () => void;
}

export function bindListScreenShortcuts(
  shortcuts: KeyboardShortcutService,
  search: ActiveScreenSearchService,
  actions: ListScreenShortcutActions,
): ShortcutBinding {
  if (actions.refresh) {
    shortcuts.registerHandler('global.refresh', actions.refresh);
  }
  if (actions.create) {
    shortcuts.registerHandler('global.new', actions.create);
  }
  if (actions.focusSearch) {
    search.register(actions.focusSearch);
  }

  return {
    unregister: () => {
      if (actions.refresh) {
        shortcuts.unregisterHandler('global.refresh');
      }
      if (actions.create) {
        shortcuts.unregisterHandler('global.new');
      }
      if (actions.focusSearch) {
        search.unregister();
      }
    },
  };
}

export function bindDetailScreenShortcuts(
  shortcuts: KeyboardShortcutService,
  save: ActiveScreenSaveService,
  print: ActiveScreenPrintService,
  actions: DetailScreenShortcutActions,
): ShortcutBinding {
  save.register(actions.save);

  if (actions.delete) {
    shortcuts.registerHandler('global.delete', actions.delete);
  }
  if (actions.cancel) {
    shortcuts.registerHandler('global.cancel', actions.cancel);
  }
  if (actions.print) {
    print.register(actions.print);
  }

  return {
    unregister: () => {
      save.unregister();
      if (actions.delete) {
        shortcuts.unregisterHandler('global.delete');
      }
      if (actions.cancel) {
        shortcuts.unregisterHandler('global.cancel');
      }
      if (actions.print) {
        print.unregister();
      }
    },
  };
}