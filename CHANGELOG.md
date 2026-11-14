2025-05-31 
# Changelog

## [3.9.0](https://github.com/Frikanalen/frontend/compare/v3.8.0...v3.9.0) (2026-11-14)


### Features

* **schedule:** staff week page of real grants, with tabs between the staff tools ([#133](https://github.com/Frikanalen/frontend/issues/133)) ([4d10a01](https://github.com/Frikanalen/frontend/commit/4d10a01f6c50166792f3ad90727d957cac191f5c))


### Bug Fixes

* **player:** rebuild the player when a hidden page comes back ([#132](https://github.com/Frikanalen/frontend/issues/132)) ([4d5d839](https://github.com/Frikanalen/frontend/commit/4d5d8393ef11c85ed63fc9c73a0ef7d34f4028b8))
* **theme:** own storage key, so Django admin's "auto" doesn't turn off dark mode ([#131](https://github.com/Frikanalen/frontend/issues/131)) ([c957c17](https://github.com/Frikanalen/frontend/commit/c957c1736452fea582d52216eb46469ae9b95d22))


### Performance Improvements

* server-rendered video poster, no live preload, one Django call per lookup ([#127](https://github.com/Frikanalen/frontend/issues/127)) ([a174eef](https://github.com/Frikanalen/frontend/commit/a174eefe6a084fb5ab080a82befd969e6dd21406))
* turn on Cache Components so public pages share a static shell ([#128](https://github.com/Frikanalen/frontend/issues/128)) ([64d6655](https://github.com/Frikanalen/frontend/commit/64d665569c7f9d99c6bca716953d0fd07f4773f7))

## [3.8.0](https://github.com/Frikanalen/frontend/compare/v3.7.0...v3.8.0) (2026-11-13)


### Features

* **grants:** staff give an organization airtime directly ([#125](https://github.com/Frikanalen/frontend/issues/125)) ([dc2d1bb](https://github.com/Frikanalen/frontend/commit/dc2d1bbd58ee8185d7ef9b630f3912ff16476534))

## [3.7.0](https://github.com/Frikanalen/frontend/compare/v3.6.0...v3.7.0) (2026-11-13)


### Features

* **auth:** offer passkeys only where the API has them on; authenticator icon ([#124](https://github.com/Frikanalen/frontend/issues/124)) ([810d7dd](https://github.com/Frikanalen/frontend/commit/810d7ddc3d4b818fe1b999aeb1452496c7c23277))
* **auth:** passkeys, security keys and several sign-in methods ([#123](https://github.com/Frikanalen/frontend/issues/123)) ([0ebac88](https://github.com/Frikanalen/frontend/commit/0ebac88aebffbce440493ee0b1101bdf26e4272d))
* **auth:** password reset pages ([#112](https://github.com/Frikanalen/frontend/issues/112)) ([12b3366](https://github.com/Frikanalen/frontend/commit/12b3366d2195ed6f67ee36b3c4cb3fa9023bb10b))
* **auth:** password strength meter, 10-character minimum ([#119](https://github.com/Frikanalen/frontend/issues/119)) ([5deb8fd](https://github.com/Frikanalen/frontend/commit/5deb8fd41d86566254143570fd7b229aba87e63e))
* **auth:** two-factor authentication: setup, login and reset code step ([#121](https://github.com/Frikanalen/frontend/issues/121)) ([3217646](https://github.com/Frikanalen/frontend/commit/3217646d88e594f0c29896299782afeef986e241))
* **live:** signal report, a check page and a broadcast monitor for live sources ([#109](https://github.com/Frikanalen/frontend/issues/109)) ([978d7de](https://github.com/Frikanalen/frontend/commit/978d7de3532a1f58ba0ac12c0fa9d3f6133dbf93))
* **organization:** fetch the description from Brreg, wider address fields ([#122](https://github.com/Frikanalen/frontend/issues/122)) ([4f5c11b](https://github.com/Frikanalen/frontend/commit/4f5c11b8b9e70fa68b1eb47c3b37dda5542e9e99))
* **organization:** fill in the signup form from Brønnøysundregistrene ([#118](https://github.com/Frikanalen/frontend/issues/118)) ([b612520](https://github.com/Frikanalen/frontend/commit/b612520701c8c6795ee42b9ac5991150ece8f5cd))
* **player:** play HLS natively on browsers that can AirPlay ([#120](https://github.com/Frikanalen/frontend/issues/120)) ([40e5732](https://github.com/Frikanalen/frontend/commit/40e5732d53ee08edec722a8e026f56d5ff44efa7))
* **profile:** redesign Endre profil, add password change ([#116](https://github.com/Frikanalen/frontend/issues/116)) ([b2667a1](https://github.com/Frikanalen/frontend/commit/b2667a10646f9916b48575692a719f51aab65558))
* **register:** ask for at least 8 password characters up front ([#115](https://github.com/Frikanalen/frontend/issues/115)) ([55879d9](https://github.com/Frikanalen/frontend/commit/55879d9c06fb115e12c9d2df0f3b2b45427a411f))


### Bug Fixes

* **live:** a slow preview is not the browser's fault ([#113](https://github.com/Frikanalen/frontend/issues/113)) ([2e5e8e2](https://github.com/Frikanalen/frontend/commit/2e5e8e216d65d66230d59f2fa708b05e0400c5b0))
* **live:** keep the signal report through a missed answer ([#111](https://github.com/Frikanalen/frontend/issues/111)) ([ff56b84](https://github.com/Frikanalen/frontend/commit/ff56b84b4190d80a857f0538810398820d8e799c))

## [3.6.0](https://github.com/Frikanalen/frontend/compare/v3.5.0...v3.6.0) (2026-11-13)


### Features

* **live:** guided setup for live sources ([#108](https://github.com/Frikanalen/frontend/issues/108)) ([05ed077](https://github.com/Frikanalen/frontend/commit/05ed077654086a53cfcd224ece803076a9285c77))
* **live:** pulled live sources ([#100](https://github.com/Frikanalen/frontend/issues/100)) ([70382ff](https://github.com/Frikanalen/frontend/commit/70382ff2ec9a03c23b0fb84329cc2c0877dff0d4))
* **nav:** Studio is a menu for users in several organizations ([#107](https://github.com/Frikanalen/frontend/issues/107)) ([8736ec8](https://github.com/Frikanalen/frontend/commit/8736ec8c7b8965b57e03f223c412a7526bd5cd67))
* redesign the site ([#99](https://github.com/Frikanalen/frontend/issues/99)) ([f24e3d3](https://github.com/Frikanalen/frontend/commit/f24e3d3e7cc2e6cc61df15edc99ec7b2ec121228))
* **schedule:** members request airtime, staff answer requests ([#104](https://github.com/Frikanalen/frontend/issues/104)) ([c5a8c5c](https://github.com/Frikanalen/frontend/commit/c5a8c5c65feb13edb774091373957b167127e1ab))
* **schedule:** slot drags only propose, 24-hour time fields, jukebox slots ([#106](https://github.com/Frikanalen/frontend/issues/106)) ([bb1d305](https://github.com/Frikanalen/frontend/commit/bb1d3051d95d3a9cd9042941a57985164f96fed6))
* **schedule:** weekly planner for staff to allocate recurring slots ([#103](https://github.com/Frikanalen/frontend/issues/103)) ([55c12c4](https://github.com/Frikanalen/frontend/commit/55c12c49aca5d5c862e61238473e2994203208d9))
* suspension notice for rogue members, /protest becomes /unntakstilstand ([#102](https://github.com/Frikanalen/frontend/issues/102)) ([22f0199](https://github.com/Frikanalen/frontend/commit/22f01990f2b294df94658ca8e9c3d270da035ef5))


### Bug Fixes

* **copy:** tighten the unntakstilstand and suspension wording ([#105](https://github.com/Frikanalen/frontend/issues/105)) ([8c92b82](https://github.com/Frikanalen/frontend/commit/8c92b8289ee294476325f33a5b0706ba2a45bfdb))

## [3.5.0](https://github.com/Frikanalen/frontend/compare/v3.4.1...v3.5.0) (2026-11-11)


### Features

* **chart:** run two replicas spread across nodes, behind a PDB ([#90](https://github.com/Frikanalen/frontend/issues/90)) ([11530e6](https://github.com/Frikanalen/frontend/commit/11530e6ad4dd5492ca160e3d8d84e25b6a38932f))
* **grants:** lead with what can be set up, show lock state, fold history ([#96](https://github.com/Frikanalen/frontend/issues/96)) ([97783b1](https://github.com/Frikanalen/frontend/commit/97783b101b17306a305709532ac96b439f9e0795))
* **schedule:** drag-and-drop grant editor, automatic vs manual at a glance ([#93](https://github.com/Frikanalen/frontend/issues/93)) ([03192b5](https://github.com/Frikanalen/frontend/commit/03192b5643411361e85ddb6de6129d4e8db54d23))
* **schedule:** replace the member planner with airtime grants ([#92](https://github.com/Frikanalen/frontend/issues/92)) ([3110b11](https://github.com/Frikanalen/frontend/commit/3110b1139b618134033b7a8cecff3ac7d50a570b))


### Bug Fixes

* **grants:** editor polish from the staging run ([#94](https://github.com/Frikanalen/frontend/issues/94)) ([41d6afd](https://github.com/Frikanalen/frontend/commit/41d6afd9f2a05704cf56887d5f724d467836b5ae))
* **grants:** explain read-only grants, fit the grant pages on a phone ([#95](https://github.com/Frikanalen/frontend/issues/95)) ([94da699](https://github.com/Frikanalen/frontend/commit/94da699f22d8e565eaf51e59e4b0b02767dee594))

## [3.4.1](https://github.com/Frikanalen/frontend/compare/v3.4.0...v3.4.1) (2026-11-08)


### Bug Fixes

* **footer:** link the API at /api, its canonical URL ([#88](https://github.com/Frikanalen/frontend/issues/88)) ([59bf0a6](https://github.com/Frikanalen/frontend/commit/59bf0a61a982b579e1e2efb3774ae9da634183f8))

## [3.4.0](https://github.com/Frikanalen/frontend/compare/v3.3.0...v3.4.0) (2026-11-08)


### Features

* migrate to HeroUI 3 ([#81](https://github.com/Frikanalen/frontend/issues/81)) ([a56e3dc](https://github.com/Frikanalen/frontend/commit/a56e3dc1b17ac494ed89f7fb89749b27ddbffe3f))
* move from frikanalen.no to frikanalen.tv ([#87](https://github.com/Frikanalen/frontend/issues/87)) ([7a82d56](https://github.com/Frikanalen/frontend/commit/7a82d562a2f720c6883429998b5eb338bdde6bad))


### Bug Fixes

* preserve autofilled auth credentials during hydration ([#86](https://github.com/Frikanalen/frontend/issues/86)) ([6c3893a](https://github.com/Frikanalen/frontend/commit/6c3893ad5ea4dcc05124c88a79ce8ea7b48fa7f6))

## [3.3.0](https://github.com/Frikanalen/frontend/compare/v3.2.0...v3.3.0) (2026-11-02)


### Features

* **protest:** add OpenGraph and Twitter card metadata ([#82](https://github.com/Frikanalen/frontend/issues/82)) ([526c69d](https://github.com/Frikanalen/frontend/commit/526c69d3c7986e45cb9aa2adf2616b5168750492))

## [3.2.0](https://github.com/Frikanalen/frontend/compare/v3.1.0...v3.2.0) (2026-10-29)


### Features

* **live:** let organizations check their incoming live feed ([#75](https://github.com/Frikanalen/frontend/issues/75)) ([2c4863a](https://github.com/Frikanalen/frontend/commit/2c4863ae622c5a2bab312cd670a87216d174ba1a))
* **live:** Opus preview with a stereo level meter ([#79](https://github.com/Frikanalen/frontend/issues/79)) ([55a9352](https://github.com/Frikanalen/frontend/commit/55a93528c130880699dc1c4af8dc71a4e2ae1394))
* **upload:** play video from DASH preview ([#73](https://github.com/Frikanalen/frontend/issues/73)) ([e007144](https://github.com/Frikanalen/frontend/commit/e007144eff3ecac6d14199cf0fb295ad7ad6dcef))
* **video:** start playback from t query ([#72](https://github.com/Frikanalen/frontend/issues/72)) ([b3a0662](https://github.com/Frikanalen/frontend/commit/b3a0662ba9a7bd8f28419044fece5b7a25e68672))


### Bug Fixes

* **live:** preview the original feed's picture only ([#77](https://github.com/Frikanalen/frontend/issues/77)) ([084bc5c](https://github.com/Frikanalen/frontend/commit/084bc5cc59572aae97f563d6af32137c6706e3ff))
* **live:** say when the browser can't play the feed's video ([#80](https://github.com/Frikanalen/frontend/issues/80)) ([4764023](https://github.com/Frikanalen/frontend/commit/4764023107d7cc56204820027a5419ea5b1fd1da))
* **nav:** make every row of the narrow-screen menu tappable ([#69](https://github.com/Frikanalen/frontend/issues/69)) ([a8082f3](https://github.com/Frikanalen/frontend/commit/a8082f35d537b8bd5aa4ed3a85c81189159bc3de))
* **org-admin:** report real ingest state, and rebuild the video lists on the shared row ([#70](https://github.com/Frikanalen/frontend/issues/70)) ([bc535ea](https://github.com/Frikanalen/frontend/commit/bc535eaaf4c923a0ed7bbbfc84405faaf99b45fd))
* **upload:** follow the replacement file after ingest rejects one ([#66](https://github.com/Frikanalen/frontend/issues/66)) ([dced87c](https://github.com/Frikanalen/frontend/commit/dced87c183555efef7eee769e7ecd51e1b18a05e))
* **video:** explain unsupported archive formats ([#71](https://github.com/Frikanalen/frontend/issues/71)) ([0969b6f](https://github.com/Frikanalen/frontend/commit/0969b6f4431b71ff43bbb16d63c5b663942db738))
* **video:** name Theora's codecs instead of guessing from the video size ([#74](https://github.com/Frikanalen/frontend/issues/74)) ([3eb65c1](https://github.com/Frikanalen/frontend/commit/3eb65c100690e8c24793f0cdd61e11afc375174c))

## [3.1.0](https://github.com/Frikanalen/frontend/compare/v3.0.0...v3.1.0) (2026-08-30)


### Features

* **schedule:** group programmes under their weekly slot ([#56](https://github.com/Frikanalen/frontend/issues/56)) ([98fa63d](https://github.com/Frikanalen/frontend/commit/98fa63d11154bdd4fb7a16d36ae2981373772ce7))
* **seo:** add robots policy and sitemap ([#51](https://github.com/Frikanalen/frontend/issues/51)) ([d972708](https://github.com/Frikanalen/frontend/commit/d9727081a1f1f18ab151da51a92c257e69cfbeca))
* **series:** add dedicated series management ([#55](https://github.com/Frikanalen/frontend/issues/55)) ([ec61c4d](https://github.com/Frikanalen/frontend/commit/ec61c4de9c57e507eec53e2932513bdfa2c712ff))
* **series:** add videos from episode editor ([#57](https://github.com/Frikanalen/frontend/issues/57)) ([b693d2c](https://github.com/Frikanalen/frontend/commit/b693d2c2dfee3a3c645f48ad4e6faec4ca92312e))
* **video:** create a series while editing a video ([#61](https://github.com/Frikanalen/frontend/issues/61)) ([df9b4d7](https://github.com/Frikanalen/frontend/commit/df9b4d7880338877607f225e80d41ba825db5ee9))
* **video:** unify creation and upload ([#54](https://github.com/Frikanalen/frontend/issues/54)) ([2817b76](https://github.com/Frikanalen/frontend/commit/2817b76c6e916aaa68e4d19c2a23a0e9ca497c51))
* **video:** use API-provided file metadata ([#53](https://github.com/Frikanalen/frontend/issues/53)) ([e973660](https://github.com/Frikanalen/frontend/commit/e973660008b7e3c718570f9ca68abc3f967f9005))


### Bug Fixes

* **api:** follow integer path parameters, and parse route params with zod ([#60](https://github.com/Frikanalen/frontend/issues/60)) ([47f8522](https://github.com/Frikanalen/frontend/commit/47f8522f30d7ab8f6cd681dd90dd6f6649a9fdbd))
* **api:** migrate video header consumers to description ([#59](https://github.com/Frikanalen/frontend/issues/59)) ([17cb6b2](https://github.com/Frikanalen/frontend/commit/17cb6b2ba09e6b033b5006338b0be9645b53e459))
* **editor:** label Markdown content areas ([cba98f6](https://github.com/Frikanalen/frontend/commit/cba98f69eb5b9df4d3712922a8661a13da4e6fad))
* **schedule:** clamp planner rows to the day being planned ([#64](https://github.com/Frikanalen/frontend/issues/64)) ([a9c8bb8](https://github.com/Frikanalen/frontend/commit/a9c8bb856d119dd069d85b9ebce2fa3b89ae135a))
* **video:** delete unimported videos ([#63](https://github.com/Frikanalen/frontend/issues/63)) ([434b90d](https://github.com/Frikanalen/frontend/commit/434b90dcb52ab932ae80bcaf01dfab7ef500ceb7))
* **videos:** pick WebmMed if dash is not available ([6bf21af](https://github.com/Frikanalen/frontend/commit/6bf21af4fb431b4ee0fb7b4d760f9acd88406866))

## [3.0.0](https://github.com/Frikanalen/frontend/compare/v2.0.4...v3.0.0) (2026-08-23)


### ⚠ BREAKING CHANGES

* **schedule:** needs Frikanalen/django-api#65 deployed; the planner reads `source` off the policy endpoint.

### Features

* Add series management and public pages ([#38](https://github.com/Frikanalen/frontend/issues/38)) ([0c0181b](https://github.com/Frikanalen/frontend/commit/0c0181bfd03f974422f445e3befb26bce83240da))
* **archive:** browse by category and by what is newest ([#30](https://github.com/Frikanalen/frontend/issues/30)) ([9e3184e](https://github.com/Frikanalen/frontend/commit/9e3184ec381302845c64f071f44d8d069711acde))
* **archive:** rebuild /video as a faceted search over the whole archive ([#44](https://github.com/Frikanalen/frontend/issues/44)) ([b376535](https://github.com/Frikanalen/frontend/commit/b3765351021f09177ec6a401d21fabeb454cde2d))
* **archive:** search the video archive from a new /video page ([#28](https://github.com/Frikanalen/frontend/issues/28)) ([f818d42](https://github.com/Frikanalen/frontend/commit/f818d42a84a10861e77ac8beea3745b5032fcf77))
* **organization:** give the org page a real archive of its own ([#29](https://github.com/Frikanalen/frontend/issues/29)) ([914b5a6](https://github.com/Frikanalen/frontend/commit/914b5a62d757ff28c0fb181bc7c0ce88c6ce44b3))
* **player:** prefer DASH sources, with a self-hosted dash.js ([#23](https://github.com/Frikanalen/frontend/issues/23)) ([58c01ff](https://github.com/Frikanalen/frontend/commit/58c01ff1759480eb733d0f25c7dd7ddc484e47f2))
* **profile:** rebuild the signed-in landing page around the work ([#39](https://github.com/Frikanalen/frontend/issues/39)) ([701fdcc](https://github.com/Frikanalen/frontend/commit/701fdccf02a8a6e0f467a81e562b43bca92d1a2a))
* **schedule:** add organization schedule planner ([#36](https://github.com/Frikanalen/frontend/issues/36)) ([4c51b73](https://github.com/Frikanalen/frontend/commit/4c51b73fe7f055836ecb786f9b8470d922cbfb68))
* **schedule:** read the weekly slot's source as `source` ([#48](https://github.com/Frikanalen/frontend/issues/48)) ([8f19327](https://github.com/Frikanalen/frontend/commit/8f1932738ca5f881473500cb01f8179d1485e69e))
* **schedule:** render recurring weekly slots ([#37](https://github.com/Frikanalen/frontend/issues/37)) ([1a27ff6](https://github.com/Frikanalen/frontend/commit/1a27ff63a2893c00e2908041aa26f3fe54abb5c3))
* **ui:** put the schedule inside the player and drop the page boxes ([#50](https://github.com/Frikanalen/frontend/issues/50)) ([19c4cf8](https://github.com/Frikanalen/frontend/commit/19c4cf878278b31545a869bc60e1ff6bc598e00e))
* **upload:** follow the ingest through to a video that exists ([dee008a](https://github.com/Frikanalen/frontend/commit/dee008a572020d95fe273358609fd7277fe90aa9))
* **video:** put the archive's row list on the series and organization pages ([#45](https://github.com/Frikanalen/frontend/issues/45)) ([53a79ee](https://github.com/Frikanalen/frontend/commit/53a79ee38ebff53cadc1b94bc72451a04af5c551))


### Bug Fixes

* **ci:** build separate staging frontend image ([bf7443f](https://github.com/Frikanalen/frontend/commit/bf7443f397ac74f21da90cebe1e7e302973807f0))
* **ci:** let release-please read its config so the chart version tracks releases ([#11](https://github.com/Frikanalen/frontend/issues/11)) ([a6b6c1c](https://github.com/Frikanalen/frontend/commit/a6b6c1ca036932270c3a2383944a3f72083409d9))
* give customAxios an absolute baseURL on the server ([#15](https://github.com/Frikanalen/frontend/issues/15)) ([395ccdc](https://github.com/Frikanalen/frontend/commit/395ccdc4f75af1503b8c2f0b39bf100eb7bbb561))
* hold the default schedule phase in state, not a ref ([cd24010](https://github.com/Frikanalen/frontend/commit/cd24010ec2ff40f74e9fc17df400873828104399))
* Improve upload state messages ([dfd27e2](https://github.com/Frikanalen/frontend/commit/dfd27e2f19e29a47ae9db334221bd0dbab6e612d))
* **layout:** stop the logo forcing sideways scroll on phones ([#40](https://github.com/Frikanalen/frontend/issues/40)) ([25fb010](https://github.com/Frikanalen/frontend/commit/25fb010f86d8a6218aaedba6c0ae18c0b0342ccb))
* **layout:** tighten the logo's top padding on phones ([#47](https://github.com/Frikanalen/frontend/issues/47)) ([25f1253](https://github.com/Frikanalen/frontend/commit/25f12534b37a882077a06b5ba7d7f031505633fb))
* resolve eslint warnings for anonymous exports and location.assign ([#22](https://github.com/Frikanalen/frontend/issues/22)) ([4f5933b](https://github.com/Frikanalen/frontend/commit/4f5933b2593cc143e8c3301b543d2078728a9a03))
* **schedule:** fit the nav bar on a phone ([#43](https://github.com/Frikanalen/frontend/issues/43)) ([86bdf35](https://github.com/Frikanalen/frontend/commit/86bdf350a896d06cb36b24446d3d7d18cd3910ad))
* **schedule:** handle an absent schedule on the front page ([#31](https://github.com/Frikanalen/frontend/issues/31)) ([5590b59](https://github.com/Frikanalen/frontend/commit/5590b599e2827bfb0729d6a256f8794b75686352))
* **schedule:** print programme times on Oslo's clock, not the viewer's ([#35](https://github.com/Frikanalen/frontend/issues/35)) ([57b6756](https://github.com/Frikanalen/frontend/commit/57b675632972ce6d3257ce3cce7f697f3d757104))
* ship @swc/helpers esm files in the standalone output ([e6f0038](https://github.com/Frikanalen/frontend/commit/e6f003876e02d6a6cab5357e08d35f5929582c68))
* stop baking Django API URL into the frontend image at build time ([#12](https://github.com/Frikanalen/frontend/issues/12)) ([4ca900b](https://github.com/Frikanalen/frontend/commit/4ca900b1298b92e63f1b4d14753be83d940545cf))
* type the orval operationName chain and adopt Next 16 tsconfig ([c490471](https://github.com/Frikanalen/frontend/commit/c49047122b5a1eac1c48389c0516d233668a9114))
* use a relative URL for the live stream playlist ([#16](https://github.com/Frikanalen/frontend/issues/16)) ([c2c0b4a](https://github.com/Frikanalen/frontend/commit/c2c0b4a966f3282d81f300cea6312e83b057e75b))
* use valid autocomplete tokens on the login and register forms ([6025276](https://github.com/Frikanalen/frontend/commit/6025276f0597fbd36b81c2c695f45321d2449745)), closes [#10](https://github.com/Frikanalen/frontend/issues/10)
* **video:** ask the API for unfinished videos by its own filter name ([#49](https://github.com/Frikanalen/frontend/issues/49)) ([2adffaf](https://github.com/Frikanalen/frontend/commit/2adffaf45a01a1f276a121ab8838bf88db822eb6))
* **video:** let a click anywhere in the box start playback ([#32](https://github.com/Frikanalen/frontend/issues/32)) ([dd4e727](https://github.com/Frikanalen/frontend/commit/dd4e72708b24c6ca72a44b7bdf7c1d13828b9909))
* **video:** match ModalIshPrototype's card to the header nav pill ([#26](https://github.com/Frikanalen/frontend/issues/26)) ([10150f3](https://github.com/Frikanalen/frontend/commit/10150f303f6a693f1f200d238753c54d687aa088))
* **video:** stop double-boxing the create-video step ([#25](https://github.com/Frikanalen/frontend/issues/25)) ([e139b3f](https://github.com/Frikanalen/frontend/commit/e139b3fce1c9b41a40e3a39d09ca522f906447e1))
* **video:** unify create -&gt; upload flow layout ([#24](https://github.com/Frikanalen/frontend/issues/24)) ([e9729cd](https://github.com/Frikanalen/frontend/commit/e9729cd3ef88221182b86a4a8363009c80915acd))

## [2.0.4](https://github.com/Frikanalen/frontend/compare/v2.0.3...v2.0.4) (2025-12-18)


### Bug Fixes

* set DJANGO_URL ([e08883b](https://github.com/Frikanalen/frontend/commit/e08883be5ef045b08762394961dad57f67377204))

## [2.0.3](https://github.com/Frikanalen/frontend/compare/v2.0.2...v2.0.3) (2025-12-18)


### Bug Fixes

* build directly in release-please context ([b9580ca](https://github.com/Frikanalen/frontend/commit/b9580ca29360bbcb309e32e0439e25bdc56c8588))

## [2.0.2](https://github.com/Frikanalen/frontend/compare/v2.0.1...v2.0.2) (2025-12-18)


### Bug Fixes

* try getting the history in checkout ([6507aba](https://github.com/Frikanalen/frontend/commit/6507aba116ef976a4a73295a212e17d061da80c2))

## [2.0.1](https://github.com/Frikanalen/frontend/compare/v2.0.0...v2.0.1) (2025-12-18)


### Bug Fixes

* Docker builds not tagging releases ([049c667](https://github.com/Frikanalen/frontend/commit/049c667d37b9939378d318db5327efc68b0c8cbf))

## [2.0.0](https://github.com/Frikanalen/frontend/compare/v1.0.0...v2.0.0) (2025-12-12)


### ⚠ BREAKING CHANGES

* update OpenAPI from django-api/main

### Bug Fixes

* dark text in dark mode ([b3da2aa](https://github.com/Frikanalen/frontend/commit/b3da2aa4c4df96dc5ddf1de64d242084f7e3a832))
* do not put build arg in quotes ([cc733f2](https://github.com/Frikanalen/frontend/commit/cc733f2daac223e0aae8ab96c41272e504ddddab))
* no classnames in layout.tsx ([3147778](https://github.com/Frikanalen/frontend/commit/31477780be8e5bae648d05998ef8cf5734b03cc9))
* set default theme to light ([5276d7f](https://github.com/Frikanalen/frontend/commit/5276d7f053b0294e01d34035f0a5ab49ca6f26cf))


### Miscellaneous Chores

* update OpenAPI from django-api/main ([d46a0ce](https://github.com/Frikanalen/frontend/commit/d46a0ce191600d39bd678838e098f37425a3eebf))

## 1.0.0 (2025-05-31)


### Features

* **ci:** abusing react 19-&gt;19.1 to trigger upgrade ([8c83d79](https://github.com/Frikanalen/frontend/commit/8c83d7972e44e075acc4fa6d85b7c8bb78f9d8d0))

## 0.1.0 (2025-05-31)

Initial changelog entry

### Bug Fixes

* wrong package name in build automation ([0478be4](https://github.com/Frikanalen/frontend/commit/0478be443fb107237a186ef9dc585b0b8b6df212))
