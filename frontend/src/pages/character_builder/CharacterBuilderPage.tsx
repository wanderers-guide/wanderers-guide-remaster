import { useEffect, useState } from 'react';
import {
  Avatar,
  Text,
  Group,
  Stack,
  Button,
  Stepper,
  Box,
  Center,
  TextInput,
  NumberInput,
  Select,
  PasswordInput,
  Tabs,
  rem,
  Switch,
  ScrollArea,
  ActionIcon,
  useMantineTheme,
  LoadingOverlay,
  Title,
} from '@mantine/core';
import BlurBox from '@common/BlurBox';
import {
  IconPhoto,
  IconMessageCircle,
  IconSettings,
  IconBooks,
  IconAsset,
  IconVocabulary,
  IconWorld,
  IconBook2,
  IconBrandSafari,
  IconMap,
  IconNotebook,
  IconDots,
  IconUsers,
  IconArrowRight,
  IconArrowLeft,
  IconTools,
  IconHome,
  IconUser,
  IconHammer,
  IconPhotoPlus,
  IconUserCircle,
  IconUserScan,
  IconPhotoUp,
  IconUserPlus,
  IconRefresh,
  IconRefreshDot,
} from '@tabler/icons-react';
import { LinksGroup } from '@common/LinksGroup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Character, ContentSource } from '@typing/content';
import { makeRequest } from '@requests/request-manager';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useDebouncedValue, useDidUpdate } from '@mantine/hooks';
import { modals, openContextModal } from '@mantine/modals';
import CharBuilderHome from './CharBuilderHome';
import CharBuilderCreation from './CharBuilderCreation';
import { useRecoilState } from 'recoil';
import { characterState } from '@atoms/characterAtoms';
import { setPageTitle } from '@utils/document-change';
import { isPlayable } from '@utils/character';
import { JSendResponse } from '@typing/requests';
import _ from 'lodash';
import { defineDefaultSources } from '@content/content-store';
import { isCharacterBuilderMobile } from '@utils/screen-sizes';
import { saveCustomization } from '@content/customization-cache';

export default function CharacterBuilderPage() {
  setPageTitle(`Builder`);

  const theme = useMantineTheme();
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const { characterId } = useLoaderData() as {
    characterId: number;
  };

  const handleStepChange = (nextStep: number) => {
    const isOutOfBounds = nextStep > 3 || nextStep < 0;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
  };

  useEffect(() => {
    if (active === 2) {
      navigate(`/sheet/${characterId}`);
    }
  }, [active]);

  const stepIconStyle = { width: rem(18), height: rem(18) };
  const pageHeight = 550;

  const queryClient = useQueryClient();

  const [character, setCharacter] = useRecoilState(characterState);

  // Fetch character from db
  const {
    data: resultCharacter,
    isLoading,
    isInitialLoading,
  } = useQuery({
    queryKey: [`find-character-${characterId}`],
    queryFn: async () => {
      const resultCharacter = await makeRequest<Character>('find-character', {
        id: characterId,
      });

      if (resultCharacter) {
        // Make sure we sync the enabled content sources
        defineDefaultSources(resultCharacter.content_sources?.enabled ?? []);

        // Cache character customization for fast loading
        saveCustomization({
          background_image_url: resultCharacter.details?.background_image_url,
          sheet_theme: resultCharacter.details?.sheet_theme,
        });
      } else {
        // Character not found, redirect to characters
        window.location.href = '/characters';
      }

      return resultCharacter;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!resultCharacter) return;
    // Update character nav state
    setCharacter(resultCharacter);
  }, [resultCharacter]);

  // Update character in db when state changed
  const [debouncedCharacter] = useDebouncedValue(character, 200);
  useDidUpdate(() => {
    if (!debouncedCharacter) return;
    mutateCharacter({
      level: debouncedCharacter.level,
      name: debouncedCharacter.name,
      details: debouncedCharacter.details,
      content_sources: debouncedCharacter.content_sources,
      operation_data: debouncedCharacter.operation_data,
    });
  }, [debouncedCharacter]);

  // Update character stats
  const { mutate: mutateCharacter } = useMutation(
    async (data: {
      name?: string;
      level?: number;
      details?: any;
      content_sources?: any;
      operation_data?: any;
    }) => {
      const response = await makeRequest<JSendResponse>('update-character', {
        id: characterId,
        ...data,
      });
      return response ? response.status === 'success' : false;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`find-character-${characterId}`]);
      },
    }
  );

  return (
    <Center>
      <Box maw={800} w='100%'>
        <Stack style={{ position: 'relative' }}>
          {!isCharacterBuilderMobile() && (
            <>
              <ActionIcon
                variant='filled'
                color='gray'
                aria-label='Next Page'
                radius='xl'
                size='xl'
                style={{
                  position: 'absolute',
                  top: '45%',
                  right: -70,
                  visibility: active === 2 ? 'hidden' : 'visible',
                }}
                onClick={() => handleStepChange(active + 1)}
                disabled={active === 1 && !isPlayable(character)}
              >
                <IconArrowRight style={{ width: '70%', height: '70%' }} stroke={2} />
              </ActionIcon>
              <ActionIcon
                variant='filled'
                color='gray'
                aria-label='Previous Page'
                radius='xl'
                size='xl'
                style={{
                  position: 'absolute',
                  top: '45%',
                  left: -70,
                  visibility: active === 0 ? 'hidden' : 'visible',
                }}
                onClick={() => handleStepChange(active - 1)}
              >
                <IconArrowLeft style={{ width: '70%', height: '70%' }} stroke={2} />
              </ActionIcon>
            </>
          )}
          <BlurBox blur={10} p='sm'>
            <Stepper
              active={active}
              onStepClick={setActive}
              iconSize={32}
              size={isCharacterBuilderMobile() ? 'xs' : undefined}
            >
              <Stepper.Step
                label='Home'
                allowStepSelect={true}
                icon={<IconHome style={stepIconStyle} />}
                completedIcon={<IconHome style={stepIconStyle} />}
              >
                <ScrollArea h={pageHeight}>
                  {character && !isLoading ? (
                    <CharBuilderHome pageHeight={pageHeight} />
                  ) : (
                    <LoadingOverlay
                      visible={isLoading}
                      zIndex={1000}
                      overlayProps={{ radius: 'md', backgroundOpacity: 0 }}
                      loaderProps={{ type: 'bars' }}
                    />
                  )}
                </ScrollArea>
              </Stepper.Step>
              <Stepper.Step
                label='Builder'
                allowStepSelect={true}
                icon={<IconHammer style={stepIconStyle} />}
                completedIcon={<IconHammer style={stepIconStyle} />}
              >
                <ScrollArea h={pageHeight}>
                  {character && !isLoading ? (
                    <CharBuilderCreation pageHeight={pageHeight} />
                  ) : (
                    <LoadingOverlay
                      visible={isLoading}
                      zIndex={1000}
                      overlayProps={{ radius: 'md', backgroundOpacity: 0 }}
                      loaderProps={{ type: 'bars' }}
                    />
                  )}
                </ScrollArea>
              </Stepper.Step>
              <Stepper.Step
                label='Sheet'
                allowStepSelect={isPlayable(character)}
                icon={<IconUser style={stepIconStyle} />}
                completedIcon={<IconUser style={stepIconStyle} />}
              >
                <ScrollArea h={pageHeight}>
                  <Text ta='center'>Redirecting to sheet...</Text>
                </ScrollArea>
              </Stepper.Step>

              <Stepper.Completed>
                <ScrollArea h={pageHeight}>Complete</ScrollArea>
              </Stepper.Completed>
            </Stepper>
          </BlurBox>
        </Stack>
      </Box>
    </Center>
  );
}
