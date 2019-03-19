import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// import configureStore from 'redux-mock-store';
// import thunk from 'redux-thunk';
import { Actions } from 'react-native-router-flux';
import { View, BackHandler, AppState } from 'react-native';
import { Colors } from '@ui/theme_default';
import DbManager from '../../app/DBManager';
import Application from '../../constants/config';
import ChatList from '../index';

configure({ adapter: new Adapter() });

jest.spyOn(Date, 'now').mockImplementation(() => 1479427300700);

jest.mock('BackHandler', () => {
  const backHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  };
  return backHandler;
});

jest.mock('AppState', () => {
  const appState = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return appState;
});

jest.mock('@utils', () => ({
  debug: jest.fn(),
  formatDate: jest.fn(),
}));

jest.mock('react-native-router-flux', () => ({
  Actions: {
    currentScene: 'Chat',
    GroupInfo: jest.fn(),
    MemberInfo: jest.fn(),
    ChatRoom: jest.fn(),
    CertIntro: jest.fn(),
  },
}));

jest.mock('../../app/DBManager', () => {
  const dbManager = {
    group: {
      addGroupListener: jest.fn(),
      removeGroupListener: jest.fn(),
      sortedList: [], // model the list
    },
    _taskManager: {
      chat: {
        fetchBackgroundGroupJob: jest.fn(() => Promise.resolve(true)),
      },
      provider: {
        meteor: {
          status: { connected: false },
        },
      },
    },
    app: {
      userId: 'MM1258g51dF92',
      reconnectHost: jest.fn(),
    },
    user: {
      loggedInUser: { _id: 'MM1258g51dF92', name: 'dreaming-dev' },
      isDiscoverEnabled: jest.fn(() => Promise.resolve(true)),
    },
  };
  return dbManager;
});

jest.mock('../../constants/config', () => ({
  APPCONFIG: {
    CHECK_FOR_DISCOVER: true,
  },
}));

// const middlewares = [thunk];
// const mockStore = configureStore(middlewares);
const logoPress = jest.fn();
const iconPress = jest.fn();
const navLogo = 16;
const props = { logoPress, iconPress, navLogo };
// const initialState = {
//   ChatList: {
//     viewed: false,
//   },
// };
// const store = mockStore(initialState);

it('ChatList renders correctly', () => {
  // const tree = renderer.create(<ChatList store={store} {...props} />).toJSON();
  const tree = renderer.create(<ChatList {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- lifeCycle methods --------------------- */
it('ChatList - componentWillMount - with user id', async () => {
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  expect.assertions(1);
  await instance.componentWillMount();
  expect(tree.state().isUserProfile).toBe(true);
});

it('ChatList - componentWillMount - no user id', async () => {
  DbManager.app.userId = null;
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  expect.assertions(1);
  await instance.componentWillMount();
  expect(tree.state().isUserProfile).toBe(false);
});

it('ChatList - componentDidMount - with user id', async () => {
  DbManager.app.userId = 'MM1258g51dF92';
  DbManager.group.addGroupListener.mockClear();
  BackHandler.addEventListener.mockClear();
  AppState.addEventListener.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.setGroupList = jest.fn();
  expect.assertions(6);
  await instance.componentDidMount();
  expect(instance._ismounted).toBe(true);
  expect(instance._insideStateUpdate).toBe(false);
  expect(instance.setGroupList).toBeCalled();
  expect(DbManager.group.addGroupListener).toBeCalled();
  expect(BackHandler.addEventListener).toBeCalledWith('hardwareBackPress', expect.any(Function));
  expect(AppState.addEventListener).toBeCalledWith('change', expect.any(Function));
});

it('ChatList - componentDidMount - no user id', async () => {
  DbManager.app.userId = null;
  DbManager.group.addGroupListener.mockClear();
  BackHandler.addEventListener.mockClear();
  AppState.addEventListener.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.setGroupList = jest.fn();
  expect.assertions(6);
  await instance.componentDidMount();
  expect(instance._ismounted).toBe(true);
  expect(instance._insideStateUpdate).toBe(false);
  expect(instance.setGroupList).toBeCalled();
  expect(DbManager.group.addGroupListener).not.toBeCalled();
  expect(BackHandler.addEventListener).toBeCalledWith('hardwareBackPress', expect.any(Function));
  expect(AppState.addEventListener).toBeCalledWith('change', expect.any(Function));
});

it('ChatList - componentWillUnmount - UserProfile is falsy', () => {
  DbManager.group.removeGroupListener.mockClear();
  BackHandler.removeEventListener.mockClear();
  AppState.removeEventListener.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: false });
  const instance = tree.instance();
  tree.unmount();
  expect(instance._mounted).toBe(false);
  expect(DbManager.group.removeGroupListener).not.toBeCalled();
  expect(BackHandler.removeEventListener).toBeCalledWith('hardwareBackPress', expect.any(Function));
  expect(AppState.removeEventListener).toBeCalledWith('change', expect.any(Function));
});

it('ChatList - componentWillUnmount - UserProfile is truthy', () => {
  DbManager.group.removeGroupListener.mockClear();
  BackHandler.removeEventListener.mockClear();
  AppState.removeEventListener.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: true });
  const instance = tree.instance();
  tree.unmount();
  expect(instance._mounted).toBe(false);
  expect(DbManager.group.removeGroupListener).toBeCalled();
  expect(BackHandler.removeEventListener).toBeCalledWith('hardwareBackPress', expect.any(Function));
  expect(AppState.removeEventListener).toBeCalledWith('change', expect.any(Function));
});

/* ------------------- component methods --------------------- */
it('ChatList - onBackPress', () => {
  BackHandler.exitApp.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.onBackPress();
  expect(BackHandler.exitApp).toBeCalled();
});

it('ChatList - removeListner', () => {
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  const result = instance.removeListner();
  expect(result).toBe(true);
});

it('ChatList - setGroupList - not updated', async () => {
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance._ismounted = true;
  instance._insideStateUpdate = true;
  expect.assertions(1);
  await instance.setGroupList();
  expect(tree.state().dataSource).toEqual([]);
});

it('ChatList - setGroupList - with discover', async () => {
  DbManager.group.sortedList = [
    {
      _id: 'GENERAL',
      name: 'GENERAL',
      displayMessage: 'Hello everyone',
      displayMessageUser: 'new-user1',
      status: null,
      type: 'c',
      avatarURL: 'http://cool-avatar.com/general-789.jpg',
      groupHeading: 'WELCOME TO GENERAL',
      displayLastMessageAt: Date.now(),
      unread: 1,
      lastReadStatus: true,
    },
    {
      _id: 'TTT11223366',
      name: 'superUser',
      displayMessage: 'Task234',
      displayMessageUser: 'new-user1',
      status: 'away',
      type: 'private',
      avatarURL: 'http://cool-avatar.com/super-000.jpg',
      groupHeading: '',
      displayLastMessageAt: Date.now(),
      unread: 0,
      lastReadStatus: false,
    },
  ];
  DbManager.user.isDiscoverEnabled.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance._ismounted = true;
  instance._insideStateUpdate = false;
  expect.assertions(4);
  await instance.setGroupList();
  expect(tree.state().dataSource).toEqual(DbManager.group.sortedList);
  expect(instance._insideStateUpdate).toBe(false);
  expect(DbManager.user.isDiscoverEnabled).toBeCalled();
  expect(tree.state().hideDiscover).toBe(true);
});

it('ChatList - setGroupList - with discover', async () => {
  DbManager.user.isDiscoverEnabled.mockClear();
  Application.APPCONFIG.CHECK_FOR_DISCOVER = false;
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance._ismounted = true;
  instance._insideStateUpdate = false;
  expect.assertions(4);
  await instance.setGroupList();
  expect(tree.state().dataSource).toEqual(DbManager.group.sortedList);
  expect(instance._insideStateUpdate).toBe(false);
  expect(DbManager.user.isDiscoverEnabled).not.toBeCalled();
  expect(tree.state().hideDiscover).toBe(false);
});

it('ChatList - userprofile - for a non direct group', () => {
  Actions.GroupInfo.mockClear();
  Actions.MemberInfo.mockClear();
  const data = { _id: 'GENERAL', type: 'c' };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.userprofile(data);
  expect(Actions.GroupInfo).toBeCalledWith({ memberId: data._id });
});

it('ChatList - userprofile - for a direct group', () => {
  Actions.GroupInfo.mockClear();
  Actions.MemberInfo.mockClear();
  const data = { _id: 'TTT11223366', type: 'd' };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.userprofile(data);
  expect(Actions.MemberInfo).toBeCalledWith({ memberId: data._id });
});

it('ChatList - onAppStateChange - turn to background', () => {
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ appState: 'active' });
  const instance = tree.instance();
  instance.setGroupList = jest.fn();
  const newAppState = 'background';
  instance.onAppStateChange(newAppState);
  expect(instance.setGroupList).toBeCalledTimes(0);
  expect(tree.state().appState).toMatch(newAppState);
});

it('ChatList - onAppStateChange - turn to active', () => {
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ appState: 'background' });
  const instance = tree.instance();
  const newAppState = 'active';
  instance.setGroupList = jest.fn();
  instance.onAppStateChange(newAppState);
  expect(instance.setGroupList).toBeCalledTimes(1);
  expect(tree.state().appState).toMatch(newAppState);
});

it('ChatList - keyExtractor', () => {
  const item = {
    _id: 'GENERAL',
    name: 'GENERAL',
    displayMessage: 'Hello everyone',
    displayMessageUser: 'new-user1',
    status: null,
    type: 'c',
    avatarURL: 'http://cool-avatar.com/general-789.jpg',
    groupHeading: 'WELCOME TO GENERAL',
    displayLastMessageAt: Date.now(),
    unread: 1,
    lastReadStatus: true,
  };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  const id = instance.keyExtractor(item);
  expect(id).toMatch(item._id);
});

it('ChatList - renderItem - from a Chat scene', () => {
  Actions.ChatRoom.mockClear();
  const item = {
    _id: 'GENERAL',
    name: 'GENERAL',
    displayMessage: 'Hello everyone',
    displayMessageUser: 'new-user1',
    status: null,
    type: 'c',
    avatarURL: 'http://cool-avatar.com/general-789.jpg',
    groupHeading: 'WELCOME TO GENERAL',
    displayLastMessageAt: Date.now(),
    unread: 1,
    lastReadStatus: true,
  };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  instance.userprofile = jest.fn();
  const view = shallow(<View>{instance.renderItem({ item })}</View>);
  const opacity = view.find('TouchableOpacity').first();
  const avatar = view.find('Avatar').first();
  opacity.props().onPress();
  avatar.props().onAvatarPress();
  expect(Actions.ChatRoom).toBeCalledWith({ roomInfo: item });
  expect(instance.userprofile).toBeCalledWith(item);
});

it('ChatList - renderItem - from the other scene', () => {
  Actions.currentScene = 'NewsScene';
  Actions.ChatRoom.mockClear();
  const item = {
    _id: 'OTR181819',
    name: 'sleeping beauty',
    status: 'busy',
    type: 'private',
    avatarURL: 'http://cool-avatar.com/general-789.jpg',
    groupHeading: 'zzzzzzzzzzz...',
    unread: 0,
    lastReadStatus: false,
  };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  const view = shallow(<View>{instance.renderItem({ item })}</View>);
  const opacity = view.find('TouchableOpacity').first();
  opacity.props().onPress();
  expect(Actions.ChatRoom).not.toBeCalled();
});

it('ChatList - renderItem - online group status', () => {
  Actions.currentScene = 'NewsScene';
  Actions.ChatRoom.mockClear();
  const item = {
    _id: 'OTR181819',
    name: 'sleeping beauty',
    status: 'online',
    type: 'd',
    avatarURL: 'http://cool-avatar.com/general-789.jpg',
    groupHeading: 'zzzzzzzzzzz...',
    unread: 0,
    lastReadStatus: false,
  };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  const view = shallow(<View>{instance.renderItem({ item })}</View>);
  const avatar = view.find('Avatar').first();
  expect(avatar.props().statusColor).toMatch(Colors.TYP_GREEN);
});

it('ChatList - renderItem - away group status', () => {
  Actions.currentScene = 'NewsScene';
  Actions.ChatRoom.mockClear();
  const item = {
    _id: 'OTR181819',
    name: 'sleeping beauty',
    status: 'away',
    type: '',
    avatarURL: 'http://cool-avatar.com/general-789.jpg',
    groupHeading: 'zzzzzzzzzzz...',
    unread: 0,
    lastReadStatus: false,
  };
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  const instance = tree.instance();
  const view = shallow(<View>{instance.renderItem({ item })}</View>);
  const icon = view.find({ name: 'pound' }).first();
  expect(icon.length).toBe(1);
});

it('ChatList - renderMain - currentScene, userProfile is present', () => {
  Actions.currentScene = 'Chat';
  Actions.CertIntro.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: true, dataSource: DbManager.group.sortedList });
  const instance = tree.instance();
  const view = shallow(<View>{instance.renderMain()}</View>);
  const flatList = view.find('FlatList').first();
  expect(flatList.length).toBe(1);
});

it('ChatList - renderMain - currentScene, no userProfile', () => {
  Actions.currentScene = 'Chat';
  Actions.CertIntro.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: false });
  const instance = tree.instance();
  const view = shallow(instance.renderMain());
  const button = view.find('Button').first();
  button.props().onPress();
  expect(Actions.CertIntro).toBeCalled();
});

it('ChatList - renderMain - the other scene, no userProfile', () => {
  Actions.currentScene = 'NewsScene';
  Actions.CertIntro.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: false });
  const instance = tree.instance();
  const view = shallow(instance.renderMain());
  const button = view.find('Button').first();
  button.props().onPress();
  expect(Actions.CertIntro).not.toBeCalled();
});

it('ChatList - on navbar press, current scene', () => {
  Actions.currentScene = 'Chat';
  Actions.CertIntro.mockClear();
  iconPress.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: true, hideDiscover: false });
  tree.update();
  const opacity = tree
    .find('NavBar')
    .shallow()
    .find('TouchableOpacity');
  opacity.props().onPress();
  expect(iconPress).toBeCalled();
});

it('ChatList - on navbar press, the other scene', () => {
  Actions.currentScene = 'NewsScene';
  Actions.CertIntro.mockClear();
  iconPress.mockClear();
  // const tree = shallow(<ChatList {...props} store={store} />).dive();
  const tree = shallow(<ChatList {...props} />);
  tree.setState({ isUserProfile: true, hideDiscover: false });
  tree.update();
  const opacity = tree
    .find('NavBar')
    .shallow()
    .find('TouchableOpacity');
  opacity.props().onPress();
  expect(iconPress).not.toBeCalled();
});
