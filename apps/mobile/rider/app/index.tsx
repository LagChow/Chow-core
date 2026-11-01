import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>LAGCHOW / RIDER</Text>
            <Text style={styles.greeting}>Good morning, Tobi</Text>
          </View>
          <Pressable style={styles.avatar} accessibilityLabel="Open profile">
            <Text style={styles.avatarText}>TO</Text>
          </Pressable>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusCopy}>
            <View style={styles.statusLabelRow}>
              <View style={[styles.statusDot, !isOnline && styles.offlineDot]} />
              <Text style={styles.statusLabel}>{isOnline ? "You are online" : "You are offline"}</Text>
            </View>
            <Text style={styles.statusHint}>
              {isOnline ? "Ready for your next delivery" : "Go online to see nearby orders"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isOnline }}
            onPress={() => setIsOnline((current) => !current)}
            style={[styles.toggle, isOnline && styles.toggleActive]}
          >
            <View style={[styles.toggleKnob, isOnline && styles.toggleKnobActive]} />
          </Pressable>
        </View>

        <View style={styles.earningsRow}>
          <View style={styles.earningBlock}>
            <Text style={styles.metricLabel}>TODAY'S EARNINGS</Text>
            <Text style={styles.metricValue}>N18,450</Text>
            <Text style={styles.metricPositive}>+18% from yesterday</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.earningBlock}>
            <Text style={styles.metricLabel}>DELIVERIES</Text>
            <Text style={styles.metricValue}>08</Text>
            <Text style={styles.metricMuted}>2 more than average</Text>
          </View>
        </View>

        {activeDelivery ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Active delivery</Text>
              <Text style={styles.liveText}>IN PROGRESS</Text>
            </View>
            <View style={styles.activeCard}>
              <View style={styles.routeLine}>
                <View style={styles.routeDotPickup} />
                <View style={styles.routeDash} />
                <View style={styles.routeDotDropoff} />
              </View>
              <View style={styles.routeDetails}>
                <View style={styles.routeStop}>
                  <Text style={styles.stopLabel}>PICK UP</Text>
                  <Text style={styles.stopName}>The Yellow Chilli</Text>
                  <Text style={styles.stopMeta}>2.4 km away / 8 min</Text>
                </View>
                <View style={styles.routeStop}>
                  <Text style={styles.stopLabel}>DROP OFF</Text>
                  <Text style={styles.stopName}>Kemi Hall, Room 14</Text>
                  <Text style={styles.stopMeta}>University of Lagos</Text>
                </View>
              </View>
              <Pressable style={styles.primaryButton} onPress={() => setActiveDelivery(false)}>
                <Text style={styles.primaryButtonText}>Mark as picked up</Text>
                <Text style={styles.buttonArrow}>-&gt;</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Nearby requests</Text>
              <Text style={styles.countText}>3 available</Text>
            </View>
            <DeliveryRequest
              vendor="Bukka Hut"
              destination="Moremi Hall"
              distance="1.8 km"
              time="12 min"
              earnings="N2,800"
              onAccept={() => setActiveDelivery(true)}
            />
            <DeliveryRequest
              vendor="The Yellow Chilli"
              destination="Kemi Hall"
              distance="2.4 km"
              time="18 min"
              earnings="N3,250"
              onAccept={() => setActiveDelivery(true)}
            />
          </View>
        )}

        <View style={styles.tipCard}>
          <View style={styles.tipMark}>
            <Text style={styles.tipMarkText}>i</Text>
          </View>
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Keep your GPS on</Text>
            <Text style={styles.tipText}>Accurate location helps us send you the closest orders.</Text>
          </View>
          <Text style={styles.tipArrow}>&gt;</Text>
        </View>

        <View style={styles.bottomNav}>
          <NavItem label="Home" active />
          <NavItem label="History" />
          <NavItem label="Earnings" />
          <NavItem label="Profile" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeliveryRequest({
  vendor,
  destination,
  distance,
  time,
  earnings,
  onAccept,
}: {
  vendor: string;
  destination: string;
  distance: string;
  time: string;
  earnings: string;
  onAccept: () => void;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        <View style={styles.vendorMark}>
          <Text style={styles.vendorMarkText}>{vendor.slice(0, 1)}</Text>
        </View>
        <View style={styles.requestNames}>
          <Text style={styles.vendorName}>{vendor}</Text>
          <Text style={styles.destination}>To {destination}</Text>
        </View>
        <Text style={styles.earnings}>{earnings}</Text>
      </View>
      <View style={styles.requestMeta}>
        <Text style={styles.metaText}>{distance}</Text>
        <View style={styles.metaSeparator} />
        <Text style={styles.metaText}>{time}</Text>
        <Pressable style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <Pressable style={styles.navItem}>
      <View style={[styles.navIcon, active && styles.navIconActive]}>
        <View style={[styles.navIconShape, active && styles.navIconShapeActive]} />
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#101311",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#A7B0A5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  greeting: {
    color: "#F5F7F2",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#D6F36A",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    color: "#101311",
    fontSize: 13,
    fontWeight: "900",
  },
  statusCard: {
    alignItems: "center",
    backgroundColor: "#182018",
    borderColor: "#2B382A",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  statusCopy: {
    flex: 1,
  },
  statusLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  statusDot: {
    backgroundColor: "#D6F36A",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  offlineDot: {
    backgroundColor: "#697167",
  },
  statusLabel: {
    color: "#F5F7F2",
    fontSize: 15,
    fontWeight: "800",
  },
  statusHint: {
    color: "#9BA69A",
    fontSize: 12,
    marginTop: 5,
  },
  toggle: {
    backgroundColor: "#354036",
    borderRadius: 16,
    height: 30,
    justifyContent: "center",
    padding: 3,
    width: 54,
  },
  toggleActive: {
    backgroundColor: "#D6F36A",
  },
  toggleKnob: {
    backgroundColor: "#A8B0A5",
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
    backgroundColor: "#101311",
  },
  earningsRow: {
    backgroundColor: "#F5F7F2",
    borderRadius: 18,
    flexDirection: "row",
    marginTop: 12,
    padding: 18,
  },
  earningBlock: {
    flex: 1,
  },
  metricDivider: {
    backgroundColor: "#DCE2D8",
    marginHorizontal: 16,
    width: 1,
  },
  metricLabel: {
    color: "#647061",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  metricValue: {
    color: "#182018",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 7,
  },
  metricPositive: {
    color: "#5C8211",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  metricMuted: {
    color: "#879185",
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginTop: 28,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#F5F7F2",
    fontSize: 19,
    fontWeight: "800",
  },
  countText: {
    color: "#A9C655",
    fontSize: 12,
    fontWeight: "800",
  },
  liveText: {
    color: "#D6F36A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  requestCard: {
    backgroundColor: "#192019",
    borderColor: "#2A382A",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
  },
  requestTop: {
    alignItems: "center",
    flexDirection: "row",
  },
  vendorMark: {
    alignItems: "center",
    backgroundColor: "#2A3A27",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  vendorMarkText: {
    color: "#D6F36A",
    fontSize: 19,
    fontWeight: "900",
  },
  requestNames: {
    flex: 1,
    marginLeft: 11,
  },
  vendorName: {
    color: "#F5F7F2",
    fontSize: 15,
    fontWeight: "800",
  },
  destination: {
    color: "#95A194",
    fontSize: 12,
    marginTop: 4,
  },
  earnings: {
    color: "#D6F36A",
    fontSize: 16,
    fontWeight: "900",
  },
  requestMeta: {
    alignItems: "center",
    borderTopColor: "#2A382A",
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 12,
  },
  metaText: {
    color: "#AAB4A7",
    fontSize: 12,
    fontWeight: "700",
  },
  metaSeparator: {
    backgroundColor: "#647061",
    borderRadius: 3,
    height: 4,
    marginHorizontal: 9,
    width: 4,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#D6F36A",
    borderRadius: 10,
    marginLeft: "auto",
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  acceptText: {
    color: "#101311",
    fontSize: 12,
    fontWeight: "900",
  },
  activeCard: {
    backgroundColor: "#F5F7F2",
    borderRadius: 20,
    flexDirection: "row",
    padding: 18,
  },
  routeLine: {
    alignItems: "center",
    paddingTop: 4,
    width: 17,
  },
  routeDotPickup: {
    backgroundColor: "#5C8211",
    borderColor: "#D6F36A",
    borderRadius: 7,
    borderWidth: 3,
    height: 14,
    width: 14,
  },
  routeDash: {
    borderColor: "#B7C2B1",
    borderStyle: "dashed",
    borderWidth: 1,
    flex: 1,
    marginVertical: 5,
    width: 1,
  },
  routeDotDropoff: {
    backgroundColor: "#182018",
    borderColor: "#182018",
    borderRadius: 7,
    borderWidth: 3,
    height: 14,
    width: 14,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  routeStop: {
    minHeight: 70,
  },
  stopLabel: {
    color: "#73806F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  stopName: {
    color: "#182018",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },
  stopMeta: {
    color: "#7D887B",
    fontSize: 11,
    marginTop: 3,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#182018",
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 12,
    width: "100%",
  },
  primaryButtonText: {
    color: "#D6F36A",
    fontSize: 12,
    fontWeight: "900",
  },
  buttonArrow: {
    color: "#D6F36A",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8,
  },
  tipCard: {
    alignItems: "center",
    backgroundColor: "#202A20",
    borderRadius: 16,
    flexDirection: "row",
    marginTop: 24,
    padding: 14,
  },
  tipMark: {
    alignItems: "center",
    backgroundColor: "#354A2B",
    borderRadius: 12,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  tipMarkText: {
    color: "#D6F36A",
    fontSize: 16,
    fontWeight: "900",
  },
  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },
  tipTitle: {
    color: "#EEF3E8",
    fontSize: 12,
    fontWeight: "800",
  },
  tipText: {
    color: "#9DA99A",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  tipArrow: {
    color: "#879681",
    fontSize: 20,
    marginLeft: 8,
  },
  bottomNav: {
    borderTopColor: "#293329",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingHorizontal: 6,
    paddingTop: 17,
  },
  navItem: {
    alignItems: "center",
    minWidth: 54,
  },
  navIcon: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    width: 24,
  },
  navIconActive: {
    backgroundColor: "#2B3C27",
    borderRadius: 8,
    height: 27,
    width: 38,
  },
  navIconShape: {
    borderColor: "#768276",
    borderRadius: 4,
    borderWidth: 2,
    height: 13,
    width: 13,
  },
  navIconShapeActive: {
    borderColor: "#D6F36A",
  },
  navLabel: {
    color: "#768276",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 7,
  },
  navLabelActive: {
    color: "#D6F36A",
  },
});
