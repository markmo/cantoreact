import { KeyboardEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorageState from 'use-local-storage-state';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import env from 'react-dotenv';

import useInfiniteScroll from '../../app/useInfiniteScroll';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import useOAuth2 from '../Login/useOAuth2';
import {
  toggleSubtreeAsync,
  getDetailAsync,
  getListByFilterAsync,
  getListBySchemeAsync,
  initializeTokenData,
  loadMoreAsync,
  loadTreeAsync,
  selectDetail,
  selectImageList,
  selectIsLoggedIn,
  selectLoadedAll,
  selectLoading,
  selectPreviewImages,
  selectTokenData,
  selectTree,
} from './viewerSlice';

const formatArr = ['png', 'jpg', 'jpeg', 'zip', 'ase', 'tif', 'pdf', 'svg', 'eps', 'ai'];

export interface TreeViewProps {
  handleNodeSelect: (scheme: string, node?: any) => (ev: React.MouseEvent<HTMLElement>) => void;
  tree: any[];
}

const TreeView = (props: TreeViewProps) => {
  const { handleNodeSelect, tree = [] } = props;
  if (!tree.length) {
    return null;
  }
  return (
    <ul>
      {tree.map((n) =>
        <li data-id={n.id} className={n.size ? 'has-sub-folder' : 'no-child'} key={n.id}
          onClick={handleNodeSelect(n.scheme, n)}
        >
          <i className={(n.scheme === 'album' ? 'icon-s-Album-20px' : 'icon-s-Folder_open-20px') + (n.loading ? ' hidden' : '')}></i>
          <img className={'folder-loading' + (n.loading ? '' : ' hidden')} alt="Loading"
            src="https://s3-us-west-2.amazonaws.com/static.dmc/universal/icon/cantoloading.gif"
          />
          <span>{n.name}</span>
          {n.open &&
            <TreeView handleNodeSelect={handleNodeSelect} tree={n.children} />
          }
        </li>
      )}
    </ul>
  );
};

const Viewer = () => {

  const detailData = useAppSelector(selectDetail);
  const previewImages = useAppSelector(selectPreviewImages);
  const imageList = useAppSelector(selectImageList);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const loadedAll = useAppSelector(selectLoadedAll);
  const loading = useAppSelector(selectLoading);
  const tokenData = useAppSelector(selectTokenData);
  const tree = useAppSelector(selectTree);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [hasTreeView, setTreeView] = useState(true);
  const [loadMore, setLoadMore] = useState(false);

  // TODO - harden
  const [localTokenData, setLocalTokenData] = useLocalStorageState(env.APP_ID, {});

  const [selectedContentId, setSelectedContentId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selected, setSelected] = useState<any>({});

  const detail = detailData[selectedContentId];

  const { loadMoreRef, reachedEnd } = useInfiniteScroll();

  const { getAuth } = useOAuth2({
    navigate,
    appId: env.APP_ID,
    authorizeUrl: env.AUTHORIZE_URL,
    redirectUrl: `${document.location.origin}/callback`,
    tokenUrl: `/api/token`,
  });

  useEffect(() => {
    dispatch(initializeTokenData(localTokenData));
  }, []);

  useEffect(() => {
    if (tokenData.tenant) {
      setLocalTokenData(tokenData);
      dispatch(loadTreeAsync());
    }
  }, [tokenData]);

  useEffect(() => {
    setLoadMore(reachedEnd);
  }, [reachedEnd]);

  useEffect(() => {
    setLoadMore(false);
    if (imageList.length > 0 && !loading && !loadedAll && loadMore) {
      dispatch(loadMoreAsync());
    }
  }, [imageList, loadedAll, loading, loadMore]);

  const getDetail = (contentId: string, scheme: string, previewUrl: string) => () => {
    dispatch(getDetailAsync({ contentId, previewUrl, scheme }));
    setSelectedContentId(contentId);
  };

  const handleCloseDetail = () => {
    setSelectedContentId('');
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleFilterSelect = (scheme: string) => () => {
    setSelectedFilter(scheme);
    setLoadMore(false);
    dispatch(getListByFilterAsync({ keywords, scheme }));
  };

  const handleNodeSelect = (scheme: string, node?: any) =>
    (ev: React.MouseEvent<HTMLElement>) => {
      ev.preventDefault();
      ev.stopPropagation();
      setLoadMore(false);
      console.log('handleNodeSelect:', scheme, node);
      if (scheme === 'folder') {
        if (node.open) {
          dispatch(toggleSubtreeAsync(node.id));
        } else {
          if (node.children && node.children.length) {
            dispatch(toggleSubtreeAsync(node.id));
          } else {
            dispatch(getListBySchemeAsync({ scheme: 'subtree', nodeId: node.id }));
          }
        }
      } else if (scheme === 'album') {
        dispatch(getListBySchemeAsync({ scheme, nodeId: node.id }));
      }
    };

  const handleSearchClick = (ev: React.MouseEvent<HTMLElement>) => {
    setLoadMore(false);
    dispatch(getListByFilterAsync({ keywords, scheme: selectedFilter || 'allfile' }));
  };

  const handleSearchSubmit = (ev: KeyboardEvent) => {
    setLoadMore(false);
    if (ev.key === 'Enter') {
      dispatch(getListByFilterAsync({ keywords, scheme: selectedFilter || 'allfile' }));
    }
  };

  const handleSelect = (id: string) => (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    setSelected((current: any) => ({
      ...current,
      [id]: !current[id]
    }));
  };

  const logout = () => {
    setLocalTokenData({});
    setTimeout(() => {
      navigate('/login');
    }, 20);
  };

  return (
    <>
      <div className="header-section">
        <div id="treeviewSwitch" className="library"
          onClick={() => setTreeView((state) => !state)}
        >
          <span className="treeview-icon icon-s-Treemenu-24"></span>
          <span className="treeview-desc">Library</span>
        </div>
        <div id="globalSearch" className="search-box ">
          <input type="text" placeholder="Global Search" className="search-icon"
            onChange={(ev) => setKeywords(ev.target.value)}
            onKeyDown={handleSearchSubmit}
          />
          <span className="icon-s-Search-20" id="globalSearchBtn"
            onClick={handleSearchClick}
          ></span>
        </div>
        <div id="filterSection" className="filter-section ">
          <span className="title">Filter by Type:</span>
          <span className={'type-font icon-s-AllFiles-32' + (selectedFilter === 'allfile' ? ' current' : '')}
            data-type="allfile" title="All Files"
            onClick={handleFilterSelect('allfile')}
          ></span>
          <span className={'type-font icon-s-Images-32' + (selectedFilter === 'image' ? ' current' : '')}
            data-type="image" title="Images Smart Album"
            onClick={handleFilterSelect('image')}
          ></span>
          <span className={'type-font icon-s-Videos-32' + (selectedFilter === 'video' ? ' current' : '')}
            data-type="video" title="Videos Smart Album"
            onClick={handleFilterSelect('video')}
          ></span>
          <span className={'type-font icon-s-Audio-32' + (selectedFilter === 'audio' ? ' current' : '')}
            data-type="audio" title="Audio Smart Album"
            onClick={handleFilterSelect('audio')}
          ></span>
          <span className={'type-font icon-s-Documents-32' + (selectedFilter === 'document' ? ' current' : '')}
            data-type="document" title="Documents Smart Album"
            onClick={handleFilterSelect('document')}
          ></span>
          <span className={'type-font icon-s-Presentations-32' + (selectedFilter === 'presentation' ? ' current' : '')}
            data-type="presentation" title="Presentations Smart Album"
            onClick={handleFilterSelect('presentation')}
          ></span>
          <span className={'type-font icon-s-Others-32' + (selectedFilter === 'other' ? ' current' : '')}
            data-type="other" title="Others Smart Album"
            onClick={handleFilterSelect('other')}
          ></span>
        </div>
        <div id="selectedCountSection" className="selected-count-section hidden"><span id="selected-count">2</span><span> File(s) Selected</span></div>
        <div className="logout-btn" id="logoutBtn" title={isLoggedIn ? 'Logout' : 'Login'}
          onClick={() => isLoggedIn ? logout() : getAuth()}
        >
          <span className="icon-s-logoout-24"></span>
        </div>
        <div id="selectedActionSection" className="selected-action-section hidden">
          <span className="action-icon icon-icn_checkmark_circle_01 all-selected" id="selectAllBtn" title="Select All"></span>
          <span className="action-btn" id="insertAssetsBtn" title="Insert these assets into target system.">Insert</span>
        </div>
      </div>

      <div className={'tree-view-section' + (hasTreeView ? ' expanded' : '')} id="treeviewSection">
        <div className="tree-view">
          <ul>
            <li id="treeviewContent" onClick={handleNodeSelect('allfile')}>
              <img className="logo" src="https://s3-us-west-2.amazonaws.com/static.dmc/universal/icon/Extension.png" alt="" />
              <a href="#">Canto Library</a>
            </li>
            <li>
              <TreeView handleNodeSelect={handleNodeSelect} tree={tree} />
            </li>
          </ul>
        </div>
      </div>

      <div className={'body-section' + (hasTreeView ? '' : ' expanded')} id="cantoImageBody">
        <div id="imagesContent" className="image-section">
          {imageList.map((m) => {
            // allow all
            // const ext = m.name.substring(m.name.lastIndexOf('.') + 1);
            // if (!formatArr.includes(ext)) {
            //   return null;
            // }
            let displayName = m.name;
            if (displayName.length > 150) {
              displayName = displayName.substr(0, 142) + '...' + displayName.substr(-5);
            }
            return (
              <div className={'single-image' + (selected[m.id] ? ' selected' : '')} key={m.id}
                data-id={m.id}
                data-schema={m.scheme}
                data-xurl={m.url.preview}
                data-name={m.name}
                data-size={m.size}
                onClick={getDetail(m.id, m.scheme, m.url.preview)}
              >
                <img id={m.id}
                  src={previewImages[m.id] || 'https://s3-us-west-2.amazonaws.com/static.dmc/universal/icon/back.png'}
                  alt={m.scheme}
                />
                <div className="mask-layer"></div>
                <div className="single-image-name">{displayName}</div>
                <span className={'select-box' + (selected[m.id] ? ' icon-s-Ok2_32' : ' icon-s-UnselectedCheck_32')}
                  onClick={handleSelect(m.id)}
                ></span><span className="select-icon-background"></span>
              </div>
            );
          })}
        </div>
        <div ref={loadMoreRef}></div>
        <div id="loadingMore" className={'loading-more' + (loading ? '' : ' hidden')}>Loading...</div>
        <div id="noItem" className={'no-item' + (loadedAll && imageList.length === 0 ? '' : ' hidden')}>No items were found to match your search.</div>
      </div>
      <div className="page-mask hidden" id="pageMask"></div>
      <div id="viewImageModal" className="view-image-modal hidden">

        <img src="" alt="image" />
        <span className="close-btn icon-s-closeicon-16px"></span>
      </div>
      <div className={'loading-icon' + (loading && false ? '' : ' hidden')}>
        <span className="loading-icon-circle">
          <svg width="56px" height="56px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" className="lds-rolling" style={{ background: 'none' }}><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="#fdfdfd" strokeWidth="10" r="35" strokeDasharray="164.93361431346415 56.97787143782138" transform="rotate(24 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>
        </span>
      </div>

      <div id="imageDetailModal" className="image-detail-modal hidden">
        <div className="page-mask"></div>
        <span className="close-btn icon-s-closeicon-16px"></span>
        <div className="detail-section">
          <div className="detail-title">Image Detail</div>
          <div className="detail-li">
            <span className="title">Name:</span>
            <span className="content" id="imageDetailModal_name">zhaosi.jpg</span>
          </div>
          <div className="detail-li">
            <span className="title">Size:</span>
            <span className="content" id="imageDetailModal_size">36044k</span>
          </div>
          <div className="detail-li">
            <span className="title">Created Time:</span>
            <span className="content" id="imageDetailModal_created">20180423081736585</span>
          </div>
          <div className="detail-li">
            <span className="title">Last Uploaded:</span>
            <span className="content" id="imageDetailModal_uploaded">20180423081736585</span>
          </div>
          <div className="detail-li">
            <span className="title">Approval Status:</span>
            <span className="content" id="imageDetailModal_status">Pending</span>
          </div>
        </div>
        <div className="insert-btn" id="insertIntoPostBtn" data-downloadurl="">Insert into Post</div>
      </div>

      {detail &&
        <div id="imagePreviewModal" className="image-preview-modal">
          <span id="previewCloseBtn" className="close-btn icon-s-closeicon-16px"
            onClick={handleCloseDetail}
          />
          <div id="imageBox" className="image-box">
            <img src={detail.imageUrl} alt="image" />
          </div>
          <div id="detailBox" className="detail-box">
            <div className="image-name" id="imagebox_name">{detail.name}</div>
            <div className="detail-list-cotnt">
              <div className="detail-item">
                <span className="title">Size:</span>
                <span className="content" id="imagebox_size">{Math.round(detail.size / 1024) + 'KB'}</span>
              </div>
              <div className="detail-item">
                <span className="title">Created Time:</span>
                <span className="content" id="imagebox_created">{(detail.metadata || {})['Create Date'] || ''}</span>
              </div>
              <div className="detail-item">
                <span className="title">Last Uploaded:</span>
                <span className="content" id="imagebox_uploaded">{formatDate(detail.lastUploaded)}</span>
              </div>
              <div className="detail-item">
                <span className="title">Approval Status:</span>
                <span className="content" id="imagebox_status">{detail.approvalStatus}</span>
              </div>
              <div className="detail-item restrict-height">
                <span className="title">Copyright:</span>
                <span className="content" id="imagebox_copyright">{detail.copyright}</span>
                {detail.copyright &&
                  <span className="more">More</span>
                }
                <div className="clear"></div>
              </div>
              <div className="detail-item restrict-height">
                <span className="title">Terms and Conditions:</span>
                <span className="content" id="imagebox_tac">{detail.termsAndConditions}</span>
                {detail.termsAndConditions &&
                  <span className="more">More</span>
                }
                <div className="clear"></div>
              </div>
              <div className="detail-item restrict-height">
                <span className="title">MDC Asset URL:</span>
                <span className="content" id="imagebox_mdc_asset_url">
                  {detail.additional['MDC Asset URL'] &&
                    <>
                      <span>{detail.additional['MDC Asset URL']}</span>
                      <CopyToClipboard
                        text={detail.additional['MDC Asset URL']}
                        onCopy={handleCopy}
                      >
                        <button title="Copy to clipboard"
                          style={{ background: 'none', border: 'none', color: '#fff' }}
                        >
                          <i className="icon-copy" />
                        </button>
                      </CopyToClipboard>
                    </>
                  }
                  {!detail.additional['MDC Asset URL'] &&
                    <span>Not published.</span>
                  }
                </span>
                {copied &&
                  <span style={{ color: '#177ddc' }}>Copied</span>
                }
                <div className="clear"></div>
              </div>
            </div>

            <div id="insertAction" className="insert-action-section">
              <div className="insert-text">Insert this asset into the target system?</div>
              <div className="btn-group">
                <div id="cancelBtn" className="cancel-btn" onClick={handleCloseDetail}>Cancel</div>
                <div id="insertBtn" className="insert-btn">Confirm</div>
              </div>

            </div>
          </div>
        </div>
      }

      <div className="max-select-tips">Sorry, you cannot select more than 20 files at once.</div>
    </>
  );
};

const formatDate = (str: string) => {
  return str.substring(0, 4) + '-' + str.substring(4, 2) + '-'
    + str.substring(6, 2) + ' ' + str.substring(8, 2) + ':' + str.substring(10, 2);
}

export default Viewer;
