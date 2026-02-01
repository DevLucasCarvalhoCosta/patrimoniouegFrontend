import type { Notice } from '@/interface/layout/notice.interface';
import type { FC } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Badge, Button, List, Popover, Space, Spin, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNoticeList } from '@/api/layout.api';
import { ReactComponent as NoticeSvg } from '@/assets/header/notice.svg';
import { clearNotifications, syncBadgeCount } from '@/utils/notifications';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const HeaderNoticeComponent: FC = () => {
  const [visible, setVisible] = useState(false);
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const { noticeCount } = useSelector(state => state.user);

  // loads the notices belonging to logged in user
  // and sets loading flag in-process
  const getNotice = async () => {
    setLoading(true);
    const { status, result } = await getNoticeList();

    setLoading(false);
    status && setNoticeList(result);
  };

  useEffect(() => {
    getNotice();
    syncBadgeCount();
  }, []);

  const handleClear = () => {
    clearNotifications();
    setNoticeList([]);
    syncBadgeCount();
  };

  const tabs = (
    <div>
      <Spin tip="Carregando..." indicator={antIcon} spinning={loading}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>Mensagens ({noticeList.length})</strong>
          <Button size="small" onClick={handleClear}>
            Limpar
          </Button>
        </Space>
        <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
          <List
            dataSource={noticeList}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={<span style={{ fontWeight: 'bold' }}>{item.title}</span>}
                  description={
                    <div className="notice-description">
                      {(item.type === 'message' || item.type === 'event') && 'description' in item && item.description && (
                        <div className="notice-description-content" style={{ marginBottom: 4 }}>
                          {item.description}
                        </div>
                      )}
                      <div className="notice-description-datetime" style={{ fontSize: '12px', color: '#999' }}>
                        {(item.type === 'notification' || item.type === 'message') && 'datetime' in item
                          ? item.datetime
                          : ''}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Spin>
    </div>
  );

  return (
    <Popover
      content={tabs}
      overlayClassName="bg-2"
      placement="bottomRight"
      trigger={['click']}
      open={visible}
      onOpenChange={v => {
        setVisible(v);

        if (v) {
          getNotice();
          syncBadgeCount();
        }
      }}
  overlayStyle={{ width: 336, maxHeight: 420, overflow: 'hidden' }}
    >
      <Tooltip title="Notificações">
        <Badge count={noticeCount} overflowCount={999}>
          <span className="notice" id="notice-center">
            <NoticeSvg className="anticon" />
          </span>
        </Badge>
      </Tooltip>
    </Popover>
  );
};

export default HeaderNoticeComponent;
