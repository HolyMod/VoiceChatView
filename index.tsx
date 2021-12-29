import {Webpack, Injector as InjectorModule, DiscordModules, Zustand, LoggerModule, DOM} from "@Holy";
import config from "./manifest.json";
import VoiceChannelButton from "./components/voicechannelbutton";
import styles from "./style.scss";
import HeaderButton from "./components/headerbutton";
import TitleDropdown, {TitleContext} from "./components/titledropdown";

const {Dispatcher, ChannelStore, SelectedChannelStore, Constants: {ChannelTypes}} = DiscordModules;
const Logger = new LoggerModule(config.name);
const Injector = InjectorModule.create(config.name);
const [useGuildsStore, GuildsStoreApi] = Zustand({guilds: {}});
const [, SidebarStore] = Zustand({isCollapsed: false});

const [
    SidebarClasses,
    Guild,
    ChannelCallChatSidebar,
    CallHeaderBar,
    ChannelItem,
    ChannelItemClasses,
    HeaderComponents
] = Webpack.bulk(
    Webpack.Filters.byProps("downloadProgressCircle"),
    Webpack.Filters.byProtos("hasFeature", "getIconURL"),
    Webpack.Filters.byDisplayName("ChannelCallChatSidebar", true),
    m => m?.default?.toString().indexOf("call-members-popout") > -1,
    Webpack.Filters.byDisplayName("ChannelItem", true),
    Webpack.Filters.byProps("iconItem", "iconBase"),
    Webpack.Filters.byProps("Title", "Caret", "default")
);

export default class VoiceChatView {
    currentChannelId = SelectedChannelStore.getChannelId();
    observer: MutationObserver;

    onStart(): void {
        this.patchGuildHasFeature();
        this.patchChannelItem();
        this.patchChannelSidebar();
        this.patchHeaderBar();
        this.patchTitle();

        DOM.injectCSS(config.name, styles);

        this.observer = new MutationObserver(this.observerCallback);

        this.observer.observe(document.body, {childList: true, subtree: true});

        SidebarStore.addListener(() => {
            const [container] = document.getElementsByClassName(SidebarClasses.sidebar);
            if (!container) return;
            
            if (SidebarStore.getState().isCollapsed) {
                // @ts-ignore
                container.style.width = 0;
            } else {
                //@ts-ignore
                container.style.width = "";
            }
        });

        this.observerCallback();
    }

    async patchGuildHasFeature() {
        Injector.inject({
            module: Guild.prototype,
            method: "hasFeature",
            after: (_, [feature]) => {
                if (feature === "TEXT_IN_VOICE_ENABLED") return true;
            }
        });
    }

    observerCallback = () => {
        const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());
        if (!channel || this.currentChannelId === channel.id) return;

        this.currentChannelId = channel.id;
        const [container] = document.getElementsByClassName(SidebarClasses.sidebar);
        if (!container) return;
        // @ts-ignore
        const currentWidth = container.style.width;
        
        if (currentWidth === "0px" && channel.type !== ChannelTypes.GUILD_VOICE) {
            //@ts-ignore
            container.style.width = "";
        } else if (SidebarStore.getState().isCollapsed && channel.type === ChannelTypes.GUILD_VOICE) {
            // @ts-ignore
            container.style.width = 0;
        }
    }

    async patchChannelItem() {
        Injector.inject({
            module: ChannelItem,
            method: "default",
            before: (_, [props]) => {
                if (props.children.some(e => e?.key === "voice-chat-view")) return;

                props.children = [
                    <VoiceChannelButton key="voice-chat-view" className={ChannelItemClasses.iconItem} onClick={() => {
                        GuildsStoreApi.setState(state => ({
                            guilds: {
                                ...state.guilds,
                                [props.channel.guild_id]: props.channel.id
                            }
                        }));
                    }} />,
                    ...props.children
                ];
            }
        });
    }

    async patchChannelSidebar() {
        function PatchedChannelSidebar(props: any) {
            const channel = useGuildsStore(s => ChannelStore.getChannel(s.guilds[props.channel.guild_id]) ?? props.channel);

            return (
                <TitleContext.Provider value={{isActive: true, guildId: channel.guild_id}}>
                    <ChannelCallChatSidebar.default {...props} channel={channel} isSelf />
                </TitleContext.Provider>
            );
        }

        Injector.inject({
            module: ChannelCallChatSidebar,
            method: "default",
            after: (_, [props]) => {
                if (props.isSelf) return;

                return (
                    <PatchedChannelSidebar {...props} />
                );
            }
        });
    }

    async patchHeaderBar() {
        Injector.inject({
            module: CallHeaderBar,
            method: "default",
            after: (_, _2, ret) => {
                ret?.props?.children?.unshift?.(
                    <HeaderButton key="hide-channels-button" onClick={() => {
                        SidebarStore.setState(state => ({isCollapsed: !state.isCollapsed}));
                    }} />
                );
            }
        });
    }

    async patchTitle() {
        Injector.inject({
            module: HeaderComponents.default,
            method: "Title",
            after: (_, _2, ret) => {
                return (
                    <TitleDropdown onSelect={(channel) => {
                        GuildsStoreApi.setState(state => ({
                            guilds: {
                                ...state.guilds,
                                [channel.guild_id]: channel.id
                            }
                        }));
                    }}>
                        {ret}
                    </TitleDropdown>
                );
            }
        });
    }

    onStop(): void {
        Injector.uninject();
        DOM.clearCSS(config.name);
        this.observer?.disconnect();
    }
}