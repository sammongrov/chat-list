import React from 'react';
import { View, FlatList, TouchableOpacity, BackHandler, Image, AppState } from 'react-native';
// import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import { Config } from '@appConfig';
import {
  Text,
  Screen,
  NavBar,
  Avatar,
  Badge,
  Icon as RNIcon,
  AntDesignIcon,
  Button,
  // WalkthroughableText,
} from '@ui/components';
import AppUtil from '@mongrov/utils';
// import { copilot, CopilotStep } from '@okgrow/react-native-copilot';
import { Colors } from '@ui/theme_default';
import { styles } from 'react-native-theme';
import { Actions } from 'react-native-router-flux';
import {DBManager} from 'app-module';
import MsgImg from '../../../src/images/messages.png';
import Application from '../../../src/constants/config';

class ChatList extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    const { logoPress, iconPress, navLogo } = props;
    // this.appDb = Dbmanager;
    this.logoPress = logoPress;
    this.iconPress = iconPress;
    this._ismounted = false;
    // this.loadData = this.props.loadData;
    this.navLogo = navLogo;
    this._mounted = false;
    this._insideStateUpdate = false;
    this.renderNumber = 0;
    this.state = {
      dataSource: [],
      isUserProfile: false,
      appState: '',
    };
    // this.currentUser = DBManager.user.loggedInUser;
  }

  componentWillMount = async () => {
    AppUtil.debug(`render chat list on component will mount`);
    const appDB = await DBManager.app;
    if (appDB && appDB.userId) {
      this.setState({ isUserProfile: true });
    }
  };

  componentDidMount = async () => {
    // const { copilotEvents, start } = this.props;
    this._ismounted = true;
    this._insideStateUpdate = false;
    // copilotEvents.on('stepChange', this.handleStepChange);
    // start();
    const appDB = await DBManager.app;
    this.setGroupList();
    if (appDB && appDB.userId) {
      DBManager.group.addGroupListener(this.setGroupList);
    }
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    AppState.addEventListener('change', this.onAppStateChange);
  };

  componentWillUnmount = () => {
    this._mounted = false;
    const { isUserProfile } = this.state;
    if (isUserProfile) {
      DBManager.group.removeGroupListener();
    }
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    AppState.removeEventListener('change', this.onAppStateChange);
  };

  onBackPress() {
    BackHandler.exitApp();
  }

  // handleStepChange = (step) => {
  //   console.log(`Current step is: ${step.name}`);
  // };

  removeListner = () => true;

  setGroupList = async () => {
    try {
      if (!this._ismounted || this._insideStateUpdate) return;
      const list = DBManager.group.sortedList;
      let hideDiscover = false;
      this.renderNumber += 1;
      AppUtil.debug(`render chat list  === ${this.renderNumber}`);
      this._insideStateUpdate = true;
      this.setState(
        {
          dataSource: list,
        },
        () => {
          this._insideStateUpdate = false;
        },
      );
      if (Application.APPCONFIG.CHECK_FOR_DISCOVER) {
        hideDiscover = await DBManager.user.isDiscoverEnabled();
        this.setState({
          hideDiscover,
        });
      } else {
        this.setState({
          hideDiscover,
        });
      }
    } catch (error) {
      console.log('Error ON', error);
    }
  };

  userprofile = (data) => {
    if (data.type !== 'd') {
      Actions.GroupInfo({
        memberId: data._id,
      });
    } else {
      Actions.MemberInfo({
        memberId: data._id,
      });
    }
  };

  onAppStateChange = (newAppState) => {
    const { appState } = this.state;
    // console.log('PREVIOUS APP STATE', appState, 'NEW APP STATE', newAppState);
    if (newAppState === 'active' && appState !== newAppState) {
      this.setGroupList();
    }
    this.setState({ appState: newAppState });
  };

  keyExtractor = (item) => item._id;

  renderItem = ({ item }) => {
    const lastMessage = item.displayMessage || 'No Message';
    const data = item;
    const lastMessageUser = item.displayMessageUser || '';
    let icon = '';
    let statusColor = Colors.TYP_GRAY;
    switch (item.status) {
      case 'online':
        statusColor = Colors.TYP_GREEN;
        break;
      case 'away':
        statusColor = Colors.TYP_YELLOW;
        break;
      case 'busy':
        statusColor = Colors.TYP_RED;
        break;
      default:
        statusColor = Colors.TYP_MIDGRAY;
    }
    switch (item.type) {
      case 'd':
        icon = null;
        break;
      case 'c':
        icon = 'pound';
        break;
      case 'private':
        icon = 'lock-outline';
        break;
      default:
        icon = 'pound';
    }
    return (
      <TouchableOpacity
        style={[styles.alignRowCenter, styles.paddingHorizontal10]}
        onPress={() => {
          if (Actions.currentScene === 'Chat') {
            Actions.ChatRoom({ roomInfo: item });
          }
        }}
      >
        <Avatar
          statusColor={item.type === 'd' ? statusColor : 'transparent'}
          avatarUrl={item.avatarURL}
          avatarName={item.name}
          key={item.avatarURL}
          onAvatarPress={() => this.userprofile(data)}
        />
        <View style={[styles.cListRowContainer]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <RNIcon
                name={icon}
                color={Colors.TYP_GRAY}
                size={16}
                style={icon !== null ? { marginRight: 3 } : null}
              />
              <Text numberOfLines={1} style={styles.cListTitle}>
                {item.groupHeading}
              </Text>
            </View>
            <View>
              <Text
                numberOfLines={1}
                style={[
                  styles.fontSize12,
                  { color: item.unread ? Colors.TYP_GREEN : Colors.TYP_GRAY },
                  { marginBottom: 5 },
                ]}
              >
                {AppUtil.formatDate(item.displayLastMessageAt)}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              height: 40,
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flexDirection: 'column', flex: 1, marginRight: 5 }}>
              {item.type !== 'd' &&
                lastMessage !== 'No Message' && (
                  <Text numberOfLines={1} style={styles.cListSubtitle}>
                    {`${lastMessageUser} `}
                  </Text>
                )}
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.flex1, styles.cListLastMessage]}
              >
                {item.lastReadStatus && (
                  <RNIcon
                    name="check"
                    type="material-community"
                    color={Colors.NAV_ICON}
                    size={11}
                  />
                )}
                {lastMessage}
              </Text>
            </View>
            {item.unread ? <Badge messageCount={item.unread} /> : <View style={{ height: 29 }} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  renderMain = () => {
    const { isUserProfile, dataSource } = this.state;
    if (isUserProfile) {
      return (
        <FlatList keyExtractor={this.keyExtractor} data={dataSource} renderItem={this.renderItem} />
      );
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={MsgImg} style={{ height: 200 }} resizeMode="contain" />
          <Text style={[styles.authTFLabelView, { textAlign: 'center' }]}>
            For sending and receiving messages, you need to setup your profile.
          </Text>
        </View>
        <Button
          title="Setup your profile"
          onPress={() => {
            if (Actions.currentScene === 'Chat') {
              Actions.CertIntro();
            }
          }}
          color={Colors.BG_BTN}
          buttonStyle={[styles.serverConfirmButton]}
          containerStyle={[styles.marginTop15]}
        />
      </View>
    );
  };

  render() {
    const { isUserProfile, hideDiscover } = this.state;
    return (
      <Screen>
        <NavBar
          // titleComponent={
          //   <TouchableOpacity onPress={this.logoPress}>
          //     <Image source={this.navLogo} style={styles.cListNavLogo} />
          //   </TouchableOpacity>
          // }
          titleText="Messages"
          rightComponent={
            !hideDiscover && (
              <TouchableOpacity
                style={[
                  styles.navSideButtonDimension,
                  styles.alignJustifyCenter,
                  styles.paddingRight10,
                ]}
                onPress={() => {
                  if (Actions.currentScene === 'Chat' && isUserProfile) {
                    this.iconPress(true);
                  }
                }}
              >
                {/* <CopilotStep
                  text="You can search the user to create a new message"
                  order={1}
                  name="search"
                >
                  <WalkthroughableText> */}
                <AntDesignIcon name="form" color={Colors.NAV_ICON} size={24} />
                {/* </WalkthroughableText>
                </CopilotStep> */}
              </TouchableOpacity>
            )
          }
        />
        {this.renderMain()}
        {/* <TouchableOpacity style={styles.cListSerachButton} onPress={Actions.SearchRoom}>
          <Icon name="plus" color={Colors.ICON_WHITE} size={31} />
        </TouchableOpacity> */}
      </Screen>
    );
  }
}

ChatList.propTypes = {
  logoPress: PropTypes.func.isRequired,
  iconPress: PropTypes.func.isRequired,
  navLogo: PropTypes.number.isRequired,
  // start: PropTypes.func.isRequired,
  // copilotEvents: PropTypes.shape({
  //   on: PropTypes.func.isRequired,
  // }).isRequired,
};

// export default copilot({
//   animated: true, // Can be true or false
//   overlay: 'svg', // Can be either view or svg
// })(ChatList);
export default ChatList;
