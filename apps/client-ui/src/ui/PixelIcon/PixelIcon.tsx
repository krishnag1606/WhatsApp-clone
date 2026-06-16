import React from 'react';
// CRA (@svgr/webpack) lets us import SVGs as React components.
// pixelarticons SVGs use fill="currentColor", so set CSS `color` to change colour.
import { ReactComponent as ChatSvg } from 'pixelarticons/svg/chat.svg';
import { ReactComponent as SearchSvg } from 'pixelarticons/svg/search.svg';
import { ReactComponent as PlusSvg } from 'pixelarticons/svg/plus.svg';
import { ReactComponent as CloseSvg } from 'pixelarticons/svg/close.svg';
import { ReactComponent as MessagePlusSvg } from 'pixelarticons/svg/message-plus.svg';
import { ReactComponent as MessageArrowSvg } from 'pixelarticons/svg/message-arrow-right.svg';
import { ReactComponent as UserSvg } from 'pixelarticons/svg/user.svg';
import { ReactComponent as UsersSvg } from 'pixelarticons/svg/users.svg';
import { ReactComponent as SunSvg } from 'pixelarticons/svg/sun.svg';
import { ReactComponent as MoonSvg } from 'pixelarticons/svg/moon.svg';
import { ReactComponent as MoreVertSvg } from 'pixelarticons/svg/more-vertical.svg';
import { ReactComponent as MoodHappySvg } from 'pixelarticons/svg/mood-happy.svg';
import { ReactComponent as TrashSvg } from 'pixelarticons/svg/trash.svg';
import { ReactComponent as EditSvg } from 'pixelarticons/svg/edit.svg';
import { ReactComponent as CheckSvg } from 'pixelarticons/svg/check.svg';
import { ReactComponent as CheckDoubleSvg } from 'pixelarticons/svg/check-double.svg';
import { ReactComponent as MenuSvg } from 'pixelarticons/svg/menu.svg';
import { ReactComponent as MailSvg } from 'pixelarticons/svg/mail.svg';
import { ReactComponent as AudioSvg } from 'pixelarticons/svg/audio-device.svg';
import { ReactComponent as UploadSvg } from 'pixelarticons/svg/upload.svg';
import { ReactComponent as ArrowLeftSvg } from 'pixelarticons/svg/arrow-left.svg';
import { ReactComponent as ArrowRightSvg } from 'pixelarticons/svg/arrow-right.svg';
import { ReactComponent as CameraSvg } from 'pixelarticons/svg/camera.svg';
import { ReactComponent as ImageSvg } from 'pixelarticons/svg/image.svg';
import { ReactComponent as LockSvg } from 'pixelarticons/svg/lock.svg';
import { ReactComponent as HomeSvg } from 'pixelarticons/svg/home.svg';
import { ReactComponent as ZapSvg } from 'pixelarticons/svg/zap.svg';
import { ReactComponent as HeartSvg } from 'pixelarticons/svg/heart.svg';
import { ReactComponent as SpeakerSvg } from 'pixelarticons/svg/speaker.svg';
import { ReactComponent as NotificationSvg } from 'pixelarticons/svg/notification.svg';
import { ReactComponent as ChartBarSvg } from 'pixelarticons/svg/chart-bar.svg';

const iconMap = {
  chat: ChatSvg,
  search: SearchSvg,
  plus: PlusSvg,
  close: CloseSvg,
  'message-plus': MessagePlusSvg,
  'message-arrow-right': MessageArrowSvg,
  user: UserSvg,
  users: UsersSvg,
  sun: SunSvg,
  moon: MoonSvg,
  'more-vertical': MoreVertSvg,
  'mood-happy': MoodHappySvg,
  trash: TrashSvg,
  edit: EditSvg,
  check: CheckSvg,
  'check-double': CheckDoubleSvg,
  menu: MenuSvg,
  mail: MailSvg,
  audio: AudioSvg,
  upload: UploadSvg,
  'arrow-left': ArrowLeftSvg,
  'arrow-right': ArrowRightSvg,
  camera: CameraSvg,
  image: ImageSvg,
  lock: LockSvg,
  home: HomeSvg,
  zap: ZapSvg,
  heart: HeartSvg,
  speaker: SpeakerSvg,
  notification: NotificationSvg,
  'chart-bar': ChartBarSvg,
} as const;

export type PixelIconName = keyof typeof iconMap;

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 20,
  color = 'currentColor',
  className,
  style,
}) => {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return (
    <Icon
      width={size}
      height={size}
      style={{ color, ...style }}
      className={className}
    />
  );
};

export default PixelIcon;
