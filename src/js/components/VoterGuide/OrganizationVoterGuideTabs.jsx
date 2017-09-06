import React, { Component, PropTypes } from "react";
import LoadingWheel from "../LoadingWheel";
import OrganizationActions from "../../actions/OrganizationActions";
import VoterGuideActions from "../../actions/VoterGuideActions";
import VoterGuideStore from "../../stores/VoterGuideStore";
import VoterGuideFollowers from "./VoterGuideFollowers";
import VoterGuideFollowing from "./VoterGuideFollowing";
import VoterGuidePositions from "./VoterGuidePositions";
import VoterStore from "../../stores/VoterStore";

export default class OrganizationVoterGuideTabs extends Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      active_route: "positions",
      current_organization_we_vote_id: "",
      organization: {},
      voter: {},
      voter_guide_followed_list: [],
      voter_guide_followers_list: [],
    };
  }

  componentDidMount () {
    // console.log("OrganizationVoterGuideTabs, componentDidMount, organization: ", this.props.organization);
    this.voterGuideStoreListener = VoterGuideStore.addListener(this._onVoterGuideStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
    OrganizationActions.organizationsFollowedRetrieve();
    VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(this.props.organization.organization_we_vote_id);
    VoterGuideActions.voterGuideFollowersRetrieve(this.props.organization.organization_we_vote_id);
    VoterGuideActions.voterGuidesRecommendedByOrganizationRetrieve(this.props.organization.organization_we_vote_id, VoterStore.election_id());
    this.setState({
      current_organization_we_vote_id: this.props.organization.organization_we_vote_id,
      organization: this.props.organization,
      voter: VoterStore.getVoter(),
    });
  }

  componentWillReceiveProps (nextProps) {
    // console.log("OrganizationVoterGuideTabs, componentWillReceiveProps, nextProps: ", nextProps);
    // When a new organization is passed in, update this component to show the new data
    if (nextProps.organization.organization_we_vote_id !== this.state.current_organization_we_vote_id) {
      OrganizationActions.organizationsFollowedRetrieve();
      VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(nextProps.organization.organization_we_vote_id);
      VoterGuideActions.voterGuideFollowersRetrieve(nextProps.organization.organization_we_vote_id);
      VoterGuideActions.voterGuidesRecommendedByOrganizationRetrieve(nextProps.organization.organization_we_vote_id, VoterStore.election_id());
      this.setState({
        current_organization_we_vote_id: nextProps.organization.organization_we_vote_id,
        organization: nextProps.organization,
      });
    }
  }

  componentWillUnmount () {
    this.voterGuideStoreListener.remove();
    this.voterStoreListener.remove();
  }

  _onVoterGuideStoreChange () {
    // console.log("OrganizationVoterGuideTabs, _onVoterGuideStoreChange, organization: ", this.state.organization);
    this.setState({
      voter_guide_followed_list: VoterGuideStore.getVoterGuidesFollowedByOrganization(this.state.organization.organization_we_vote_id),
      voter_guide_followers_list: VoterGuideStore.getVoterGuidesFollowingOrganization(this.state.organization.organization_we_vote_id),
    });
  }

  _onVoterStoreChange () {
    this.setState({
      voter: VoterStore.getVoter(),
    });
   }

  render () {
    if (!this.state.organization || !this.state.voter) {
      return <div>{LoadingWheel}</div>;
    }

    let looking_at_self = false;
    if (this.state.voter) {
      looking_at_self = this.state.voter.linked_organization_we_vote_id === this.state.organization.organization_we_vote_id;
    }
    let positions_title = "";
    let following_title_long = "";
    let following_title_short = "";
    let followers_title = "";
    let voter_guide_followers_list = this.state.voter_guide_followers_list || [];
    if (this.state.voter.linked_organization_we_vote_id === this.state.organization.organization_we_vote_id) {
      // If looking at your own voter guide, filter out your own entry as a follower
      voter_guide_followers_list = voter_guide_followers_list.filter( (one_voter_guide) =>
        one_voter_guide.organization_we_vote_id !== this.state.voter.linked_organization_we_vote_id ? one_voter_guide : null
      );
    }
    if (looking_at_self) {
      positions_title = "Your Positions";
      following_title_long = this.state.voter_guide_followed_list.length === 0 ?
        "You Are Following" : "You Are Following " + this.state.voter_guide_followed_list.length;
      following_title_short = "Following";
      followers_title = voter_guide_followers_list.length === 0 ?
        "Followers" : voter_guide_followers_list.length + " Followers";
    } else {
      positions_title = "Positions";
      following_title_long = this.state.voter_guide_followed_list.length === 0 ?
        "Following" : "Following " + this.state.voter_guide_followed_list.length;
      following_title_short = "Following";
      followers_title = voter_guide_followers_list.length === 0 ?
        "Followers" : voter_guide_followers_list.length + " Followers";
    }

    let voter_guide_component_to_display = null;
    switch (this.state.active_route) {
      default:
      case "positions":
        voter_guide_component_to_display = <VoterGuidePositions organization={this.state.organization} />;
        break;
      case "following":
        voter_guide_component_to_display = <VoterGuideFollowing organization={this.state.organization} />;
        break;
      case "followers":
        voter_guide_component_to_display = <VoterGuideFollowers organization={this.state.organization} />;
        break;
    }

    return (
      <div className="col-md-8 col-sm-12">
        <div className="tabs__tabs-container-wrap">
          <div className="tabs__tabs-container hidden-print">
            <ul className="nav tabs__tabs">
              <li className="tab-item">
                <a onClick={() => this.setState({ active_route: "positions", })} className={this.state.active_route === "positions" ? "tab tab-active" : "tab tab-default"}>
                  <span>{positions_title}</span>
                </a>
              </li>

              <li className="tab-item">
                <a onClick={() => this.setState({ active_route: "following", })} className={this.state.active_route === "following" ? "tab tab-active" : "tab tab-default"}>
                  <span>
                    <span className="hidden-xs">{following_title_long}</span>
                    <span className="visible-xs">{following_title_short}</span>
                  </span>
                </a>
              </li>

              <li className="tab-item">
                <a onClick={() => this.setState({ active_route: "followers", })} className={this.state.active_route === "followers" ? "tab tab-active" : "tab tab-default"}>
                  <span>{followers_title}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        {voter_guide_component_to_display}
      </div>
    );
  }
}
