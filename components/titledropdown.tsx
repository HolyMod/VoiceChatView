import {DiscordModules, Utilities, Webpack} from "@Holy";
import React from "react";

const {Popout, Caret, Flux, ChannelsStore, GuildStore, Scrollers, Constants: {ChannelTypes}} = DiscordModules;
const ThreadUtils = Webpack.findByProps("useHasActiveThreads");
const ChannelIconUtils = Webpack.findByProps("getChannelIconComponent");

export const TitleContext = React.createContext({isActive: false, guildId: ""});

export function ChannelIcon({channel}) {
    const {guildId} = React.useContext(TitleContext);
    const guild = Flux.useStateFromStores([GuildStore], () => GuildStore.getGuild(guildId));

    const activeThreads = ThreadUtils.useHasActiveThreads(channel);

    const Icon = ChannelIconUtils.getChannelIconComponent(channel, guild, {
        hasActiveThreads: activeThreads.hasActiveThreads
    });

    if (!Icon) return null;

    return (
        <Icon />
    );
};

export function sortChannels(a: any, b: any) {
    return a.position - b.position;
}

export function TitleDropdownContainer({onSelect}) {
    const {guildId} = React.useContext(TitleContext);
    const channels = Flux.useStateFromStoresArray([ChannelsStore], () => {
        const channels = Object.values<any>(ChannelsStore.getMutableGuildChannelsByGuild()[guildId]);

        return channels.sort(sortChannels);
    });

    return (
        <div className="vcbtn-dropdown">
            <Scrollers.ScrollerThin>
                {channels.map(channel => {
                    const handleSelect = function () {
                        if (channel.type === ChannelTypes.GUILD_CATEGORY) return;

                        onSelect(channel);
                    };

                    return (
                        <div className={Utilities.joinClassNames("vcbtn-dropdown-channel", [channel.type === ChannelTypes.GUILD_CATEGORY, "vcbtn-dropdown-channel-category"])} key={"channels--" + channel.id} onClick={handleSelect}>
                            <ChannelIcon channel={channel} />
                            <span className="vcbtn-dropdown-channel-name">{channel.name}</span>
                        </div>
                    );
                })}
            </Scrollers.ScrollerThin>
        </div>
    );
}

export default function TitleDropdown({children, onSelect}) {
    const [isShown, setShown] = React.useState(false);
    const context = React.useContext(TitleContext);
    if (!context.isActive) return children;

    return (
        <Popout
            position={Popout.Positions.BOTTOM}
            align={Popout.Align.CENTER}
            animation={Popout.Animation.FADE}
            renderPopout={() => (
                <TitleDropdownContainer onSelect={onSelect} />
            )}
            onRequestClose={() => setShown(false)}
            onRequestOpen={() => setShown(true)}
            shouldShow={isShown}
        >
            {() => (
                <div className="vcbtn-channel-header" onClick={setShown.bind(null, !isShown)}>
                    {children}
                    <Caret direction={Caret.Directions.DOWN} />
                </div>
            )}
        </Popout>
    );
}