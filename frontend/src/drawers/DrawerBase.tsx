import { drawerState } from '@atoms/navAtoms';
import {
  ActionIcon,
  Box,
  Text,
  Divider,
  Drawer,
  Group,
  HoverCard,
  ScrollArea,
  Title,
} from '@mantine/core';
import { useRecoilState, useRecoilValue } from 'recoil';
import { IconArrowLeft, IconHelpTriangleFilled, IconX } from '@tabler/icons-react';
import _ from 'lodash';
import { FeatDrawerContent, FeatDrawerTitle } from './types/FeatDrawer';
import { ActionDrawerContent, ActionDrawerTitle } from './types/ActionDrawer';
import { useElementSize, useLocalStorage, usePrevious } from '@mantine/hooks';
import React, { useRef, useState } from 'react';
import { SpellDrawerContent, SpellDrawerTitle } from './types/SpellDrawer';
import { openContextModal } from '@mantine/modals';
import { ContentType, AbilityBlockType } from '@typing/content';
import { convertToContentType } from '@content/content-utils';
import { ClassDrawerTitle, ClassDrawerContent } from './types/ClassDrawer';
import { ClassFeatureDrawerContent, ClassFeatureDrawerTitle } from './types/ClassFeatureDrawer';
import { PrevMetadata } from './drawer-utils';
import * as JsSearch from 'js-search';
import { AncestryDrawerContent, AncestryDrawerTitle } from './types/AncestryDrawer';
import { LanguageDrawerContent, LanguageDrawerTitle } from './types/LanguageDrawer';
import { BackgroundDrawerTitle, BackgroundDrawerContent } from './types/BackgroundDrawer';
import { StatProfDrawerContent, StatProfDrawerTitle } from './types/StatProfDrawer';
import { StatAttrDrawerContent, StatAttrDrawerTitle } from './types/StatAttrDrawer';
import { StatHealthDrawerContent, StatHealthDrawerTitle } from './types/StatHealthDrawer';
import { GenericDrawerContent, GenericDrawerTitle } from './types/GenericDrawer';
import { TraitDrawerTitle, TraitDrawerContent } from './types/TraitDrawer';
import { AddItemDrawerContent, AddItemDrawerTitle } from './types/AddItemDrawer';
import { ItemDrawerContent, ItemDrawerTitle } from './types/ItemDrawer';
import { InvItemDrawerContent, InvItemDrawerTitle } from './types/InvItemDrawer';

export default function DrawerBase() {
  /* Use this syntax as the standard API for opening drawers:

    const [_drawer, openDrawer] = useRecoilState(drawerState);
    openDrawer({ type: 'feat', data: { id: 1 } });
  */

  const [_drawer, openDrawer] = useRecoilState(drawerState);

  const { ref, height: titleHeight } = useElementSize();

  const viewport = useRef<HTMLDivElement>(null);
  const [value, setValue] = useLocalStorage<PrevMetadata>({
    key: 'prev-drawer-metadata',
    defaultValue: {
      scrollTop: 0,
      openedDict: {},
    },
  });

  const saveMetadata = (openedDict?: Record<string, string>) => {
    const newMetadata = {
      scrollTop: viewport.current!.scrollTop ?? 0,
      openedDict: openedDict ?? value.openedDict,
    };
    setValue(newMetadata);
  };

  const handleDrawerClose = () => {
    openDrawer(null);
  };

  const handleDrawerGoBack = () => {
    let history = [...(_drawer?.extra?.history ?? [])];
    const newDrawer = history.pop();
    if (!newDrawer) return handleDrawerClose();

    openDrawer({
      type: newDrawer.type,
      data: newDrawer.data,
      extra: {
        history,
      },
    });

    setTimeout(() => {
      viewport.current!.scrollTo({ top: value.scrollTop });
    }, 1);
  };

  return (
    <Drawer
      opened={!!_drawer}
      onClose={handleDrawerClose}
      title={
        <Box ref={ref}>
          <Group gap={12} justify='space-between'>
            <Box style={{ flex: 1 }}>
              <DrawerTitle />
              <Divider />
            </Box>
            {!!_drawer?.extra?.history?.length ? (
              <ActionIcon
                variant='light'
                color='gray.4'
                radius='xl'
                size='md'
                onClick={handleDrawerGoBack}
                aria-label='Go back to previous drawer'
              >
                <IconArrowLeft size='1.2rem' stroke={1.5} />
              </ActionIcon>
            ) : (
              <ActionIcon
                variant='light'
                color='gray.4'
                radius='xl'
                size='md'
                onClick={handleDrawerClose}
                aria-label='Close drawer'
              >
                <IconX size='1.2rem' stroke={1.5} />
              </ActionIcon>
            )}
          </Group>
        </Box>
      }
      withCloseButton={false}
      position='right'
      zIndex={1000}
      styles={{
        title: {
          width: '100%',
        },
        header: {
          paddingBottom: 0,
        },
        body: {
          paddingRight: 2,
        },
      }}
    >
      {/* TODO: There's a weird bug here where the titleHeight=0 on the first open of this drawer */}
      {/* This "fix" will still have the bug on titles that are multiline */}
      <ScrollArea
        viewportRef={viewport}
        h={`calc(100vh - (${titleHeight || 30}px + 40px))`}
        pr={18}
      >
        <Box
          pt={8}
          style={{
            overflowX: 'hidden',
          }}
        >
          <DrawerContent
            onMetadataChange={(openedDict) => {
              saveMetadata(openedDict);
            }}
          />
        </Box>
      </ScrollArea>

      {_drawer &&
        ![
          'character',
          'stat-prof',
          'stat-attr',
          'stat-hp',
          'stat-resist-weak',
          'add-item',
          'add-spell',
          'inv-item',
        ].includes(_drawer.type) && (
          <HoverCard shadow='md' openDelay={500} zIndex={1000} withArrow withinPortal>
            <HoverCard.Target>
              <ActionIcon
                variant='subtle'
                aria-label='Help and Feedback'
                radius='xl'
                color='dark.3'
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                }}
                onClick={() => {
                  handleDrawerClose();
                  openContextModal({
                    modal: 'contentFeedback',
                    title: <Title order={3}>Content Details</Title>,
                    innerProps: {
                      type: convertToContentType(_drawer.type as ContentType | AbilityBlockType),
                      data: _drawer.data,
                    },
                  });
                }}
              >
                <IconHelpTriangleFilled style={{ width: '70%', height: '70%' }} stroke={1.5} />
              </ActionIcon>
            </HoverCard.Target>
            <HoverCard.Dropdown py={0} px={10}>
              <Text size='sm'>Something wrong?</Text>
            </HoverCard.Dropdown>
          </HoverCard>
        )}
    </Drawer>
  );
}

const DrawerTitle = React.forwardRef((props: {}, ref: React.LegacyRef<HTMLDivElement>) => {
  const _drawer = useRecoilValue(drawerState);
  return (
    <div ref={ref}>
      {_drawer?.type === 'generic' && <GenericDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'feat' && <FeatDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'action' && <ActionDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'spell' && <SpellDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'item' && <ItemDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'class' && <ClassDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'class-feature' && <ClassFeatureDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'ancestry' && <AncestryDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'background' && <BackgroundDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'language' && <LanguageDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'heritage' && <ActionDrawerTitle data={_drawer.data} />} {/* TODO */}
      {_drawer?.type === 'sense' && <ActionDrawerTitle data={_drawer.data} />} {/* TODO */}
      {_drawer?.type === 'physical-feature' && <ActionDrawerTitle data={_drawer.data} />}{' '}
      {/* TODO */}
      {_drawer?.type === 'stat-prof' && <StatProfDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'stat-attr' && <StatAttrDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'stat-hp' && <StatHealthDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'trait' && <TraitDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'add-item' && <AddItemDrawerTitle data={_drawer.data} />}
      {_drawer?.type === 'inv-item' && <InvItemDrawerTitle data={_drawer.data} />}
    </div>
  );
});

function DrawerContent(props: {
  onMetadataChange?: (openedDict?: Record<string, string>) => void;
}) {
  const _drawer = useRecoilValue(drawerState);
  return (
    <>
      {_drawer?.type === 'generic' && <GenericDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'feat' && <FeatDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'action' && <ActionDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'spell' && <SpellDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'item' && <ItemDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'class' && (
        <ClassDrawerContent data={_drawer.data} onMetadataChange={props.onMetadataChange} />
      )}
      {_drawer?.type === 'class-feature' && <ClassFeatureDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'ancestry' && (
        <AncestryDrawerContent data={_drawer.data} onMetadataChange={props.onMetadataChange} />
      )}
      {_drawer?.type === 'background' && (
        <BackgroundDrawerContent data={_drawer.data} onMetadataChange={props.onMetadataChange} />
      )}
      {_drawer?.type === 'language' && <LanguageDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'heritage' && <ActionDrawerContent data={_drawer.data} />} {/* TODO */}
      {_drawer?.type === 'sense' && <ActionDrawerContent data={_drawer.data} />} {/* TODO */}
      {_drawer?.type === 'physical-feature' && <ActionDrawerContent data={_drawer.data} />}{' '}
      {/* TODO */}
      {_drawer?.type === 'stat-prof' && <StatProfDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'stat-attr' && <StatAttrDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'stat-hp' && <StatHealthDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'trait' && <TraitDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'add-item' && <AddItemDrawerContent data={_drawer.data} />}
      {_drawer?.type === 'inv-item' && <InvItemDrawerContent data={_drawer.data} />}
    </>
  );
}
