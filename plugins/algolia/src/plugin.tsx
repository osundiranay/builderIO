import { Builder } from '@builder.io/react';
import appState from '@builder.io/app-context';
import { pluginId } from './constants';
import { syncToAlgolia } from './sync-to-algolia';
import { createWebhook } from './create-web-hook';

Builder.register('plugin', {
  id: pluginId,
  name: 'Shopify Algolia',
  settings: [
    {
      name: 'alogiaKey',
      type: 'text',
      defaultValue: true,
      helperText: 'todo add here',
    },
    {
      name: 'algoliaAppId',
      type: 'text',
      defaultValue: true,
      helperText: 'todo add here',
    },
  ],

  ctaText: 'Save',

  async onSave(actions: OnSaveActions) {
    // update plugin setting
    await actions.updateSettings({
      hasConnected: true,
    });

    appState.dialogs.alert(
      'Plugin settings saved. Visit https://builder.io/models to sync a model to Algolia.'
    );
  },
});

interface OnSaveActions {
  updateSettings(partal: Record<string, any>): Promise<void>;
}

interface AppActions {
  triggerSettingsDialog(pluginId: string): Promise<void>;
}

Builder.register('app.onLoad', async ({ triggerSettingsDialog }: AppActions) => {
  const pluginSettings = appState.user.organization.value.settings.plugins?.get(pluginId);
  // const hasConnected = pluginSettings?.get('hasConnected');
  const hasConnected = false;
  if (!hasConnected) {
    await triggerSettingsDialog(pluginId);
  }
});

Builder.register('model.action', {
  name: 'Sync to Algolia',
  showIf() {
    return appState.user.can('admin');
  },
  async onClick(model: any) {
    // TODO: either add a prompt here to create or delete webhook
    // or add a new action to remove it
    if (
      !(await appState.dialogs.confirm(
        `This will sync all current and future entries in the "${model.name}" model to Algolia. It may take some time to complete.`,
        'continue'
      ))
    ) {
      return;
    }
    appState.globalState.showGlobalBlockingLoadingIndicator = true;
    await syncToAlgolia(model.name);
    await createWebhook(model.name);
    appState.globalState.showGlobalBlockingLoadingIndicator = false;
  },
});