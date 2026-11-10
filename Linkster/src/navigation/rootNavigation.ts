import {
  CommonActions,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';

export type MessengerTabName = 'Orbit' | 'Links' | 'Calls' | 'Deck' | 'Self';

/** Переключение вкладок MessengerTabs (внутри MainTabs) из любой вложенности */
export function navigateMessengerTab(
  navigation: NavigationProp<ParamListBase>,
  tab: MessengerTabName,
  params?: object
) {
  const action = CommonActions.navigate({
    name: 'MainTabs',
    params: {
      screen: tab,
      params,
    },
  });

  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  for (let depth = 0; depth < 12 && nav; depth += 1) {
    const state = nav.getState?.() as { routeNames?: string[] } | undefined;
    if (state?.routeNames?.includes('MainTabs')) {
      nav.dispatch(action);
      return;
    }
    nav = nav.getParent() ?? undefined;
  }

  navigation.dispatch(action);
}

/** Stack с CallScreen / UserProfile (MainAppStack) из любой вложенности */
export function navigateRoot(
  navigation: NavigationProp<ParamListBase>,
  screen: string,
  params?: object
) {
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  for (let depth = 0; depth < 12 && nav; depth += 1) {
    const state = nav.getState?.() as { routeNames?: string[] } | undefined;
    if (state?.routeNames?.includes(screen)) {
      nav.navigate(screen as never, params as never);
      return;
    }
    nav = nav.getParent() ?? undefined;
  }
  navigation.navigate(screen as never, params as never);
}
