import type { Meta, StoryObj } from '@storybook/react-vite';

import sampleImage from '@/assets/sample-image.jpg';
import { Image, type ImageAspectRatio } from './Image';

const aspectRatios: ImageAspectRatio[] = ['1/1', '4/3', '3/2', '16/9', '3/4', '2/3', '9/16'];

const meta = {
  title: 'Atoms/Image',
  component: Image,
  args: {
    src: sampleImage,
    alt: 'Doctor in a white shirt smiling at the camera',
    aspectRatio: '1/1',
    fit: 'cover',
  },
  argTypes: {
    aspectRatio: {
      control: 'select',
      options: ['auto', ...aspectRatios],
    },
    fallback: {
      control: false,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '12rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Decorative: Story = {
  args: {
    alt: '',
  },
};

export const Contain: Story = {
  args: {
    aspectRatio: '16/9',
    fit: 'contain',
  },
};

export const AspectRatios: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1rem' }}>
      {aspectRatios.map((ratio) => (
        <figure key={ratio} style={{ width: '8rem', margin: 0 }}>
          <Image {...args} aspectRatio={ratio} />
          <figcaption>{ratio}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const WithFallback: Story = {
  args: {
    src: 'https://invalid.example/missing.png',
    fallback: <div style={{ padding: '1rem', background: '#f1f5f9' }}>Image unavailable</div>,
  },
};
