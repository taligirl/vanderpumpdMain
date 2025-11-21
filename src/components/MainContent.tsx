import React from 'react';
import { BrowseTab } from './BrowseTab';
import { DiaryTab } from './DiaryTab';
import { FriendsTab } from './FriendsTab';
import { NotificationsTab } from './NotificationsTab';
import { CollectionsTab } from './CollectionsTab';
import { ProfileTab } from '../pages/ProfileTab';
import { SettingsTab } from './SettingsTab';
import { EpisodeModal } from './EpisodeModal';

export function MainContent(props: any) {
  const { tab, user } = props;

  return (
    <div style={{ marginTop: 16 }}>
      {tab === 'browse' && (
        <BrowseTab
          episodes={props.episodes}
          finalList={props.finalList}
          query={props.query}
          setQuery={props.setQuery}
          searchIn={props.searchIn}
          setSearchIn={props.setSearchIn}
          seasonFilter={props.seasonFilter}
          setSeasonFilter={props.setSeasonFilter}
          seasonOptions={props.seasonOptions}
          minStars={props.minStars}
          setMinStars={props.setMinStars}
          onlyFavs={props.onlyFavs}
          setOnlyFavs={props.setOnlyFavs}
          onlyRated={props.onlyRated}
          setOnlyRated={props.setOnlyRated}
          onlyWatched={props.onlyWatched}
          setOnlyWatched={props.setOnlyWatched}
          onlyUnwatched={props.onlyUnwatched}
          setOnlyUnwatched={props.setOnlyUnwatched}
          hideWatched={props.hideWatched}
          setHideWatched={props.setHideWatched}
          sortBy={props.sortBy}
          setSortBy={props.setSortBy}
          funny={props.funny}
          setFunny={props.setFunny}
          resetFilters={props.resetFilters}
          collections={props.collections}
          collectionFilterId={props.collectionFilterId}
          setCollectionFilterId={props.setCollectionFilterId}
          episodeTags={props.episodeTags}
          ratings={props.ratings}
          favs={props.favs}
          watchedAt={props.watchedAt}
          watchDates={props.watchDates}
          watchCounts={props.watchCounts}
          watchDateFilter={props.watchDateFilter}
          setWatchDateFilter={props.setWatchDateFilter}
          openEpisode={props.openEpisode}
          setRating={props.setRating}
          toggleFav={props.toggleFav}
          watchDateInputs={props.watchDateInputs}
          setWatchDateInputs={props.setWatchDateInputs}
          logWatch={props.logWatch}
          deleteLatestReview={props.deleteLatestReview}
          addReview={props.addReview}
          editReview={props.editReview}
          deleteReview={props.deleteReview}
          reviews={props.reviews}
          commentsByReview={props.commentsByReview}
          loadComments={props.loadComments}
          addComment={props.addComment}
          toggleCommentReaction={props.toggleCommentReaction}
          toggleReviewReaction={props.toggleReviewReaction}
        />
      )}

      {user && tab === 'diary' && (
        <DiaryTab
          episodes={props.episodes}
          ratings={props.ratings}
          favs={props.favs}
          watched={props.watched}
          isInDiary={props.isInDiary}
          openReviewModal={props.openReviewModal}
          isEpisodeInAnyCollection={props.isEpisodeInAnyCollection}
          collections={props.collections}
          episodeTags={props.episodeTags}
          setCollectionPickerOpen={props.setCollectionPickerOpen}
          setCollectionPickerTargetEp={props.setCollectionPickerTargetEp}
        />
      )}

      {user && tab === 'friends' && <FriendsTab />}

      {user && tab === 'notifications' && (
        <NotificationsTab
          userId={user?.id ?? null}
          setNotifCount={props.setNotifCount}
        />
      )}

      {tab === 'collections' && (
        <CollectionsTab
          collections={props.collections}
          setCollections={props.setCollections}
          episodes={props.episodes}
          setTab={props.setTab}
          setQuery={props.setQuery}
          setFunny={props.setFunny}
          setCollectionFilterId={props.setCollectionFilterId}
          updateCollection={props.updateCollection}
          addActivity={props.addActivity}
          episodeTags={props.episodeTags}
        />
      )}

      {/* [TAB-PROFILE-RENDER] */}
      <ProfileTab />

      {user && tab === 'settings' && (
        <SettingsTab
          goTab={props.goTab}
          supabase={props.supabase}
          hasSupabaseConfig={props.hasSupabaseConfig}
          pushToast={props.pushToast}
          profile={props.profile}
          setProfile={props.setProfile}
          unsaved={props.unsaved}
          setUnsaved={props.setUnsaved}
          avatarFileRef={props.avatarFileRef}
          handleAvatarFileChange={props.handleAvatarFileChange}
          coverFileRef={props.coverFileRef}
          handleCoverFileChange={props.handleCoverFileChange}
          saveProfileNow={props.saveProfileNow}
          savingProfile={props.savingProfile}
          setSaveToast={props.setSaveToast}
        />
      )}

      {props.epForModal ? (
        <EpisodeModal
          ep={props.epForModal}
          ratings={props.ratings}
          favs={props.favs}
          setRating={props.setRating}
          toggleFav={props.toggleFav}
          watchDateInputs={props.watchDateInputs}
          setWatchDateInputs={props.setWatchDateInputs}
          logWatch={props.logWatch}
          watchCounts={props.watchCounts}
          deleteLatestReview={props.deleteLatestReview}
          avgStars={props.avgStars}
          reviewView={props.reviewView}
          setReviewView={props.setReviewView}
          reviews={props.reviews}
          commentsByReview={props.commentsByReview}
          loadComments={props.loadComments}
          addComment={props.addComment}
          toggleCommentReaction={props.toggleCommentReaction}
          toggleReviewReaction={props.toggleReviewReaction}
          addReview={props.addReview}
          editReview={props.editReview}
          deleteReview={props.deleteReview}
          publics={props.publics}
          publicReplies={props.publicReplies}
          addPublicReply={props.addPublicReply}
          copyText={props.copyText}
          closeEpisode={props.closeEpisode}
        />
      ) : null}
    </div>
  );
}
