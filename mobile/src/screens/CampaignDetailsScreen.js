import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { campaignService } from '../services/campaignService';
import { combatService } from '../services/combatService';

const CampaignDetailsScreen = ({ route, navigation }) => {
  const { campaign } = route.params;
  const [campaignData, setCampaignData] = useState(campaign);
  const [members, setMembers] = useState([]);
  const [combats, setCombats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCampaignData = async () => {
    try {
      // Load members
      const membersResult = await campaignService.getMembers(campaign.id);
      if (membersResult.success) {
        setMembers(membersResult.data);
      }

      // Load combats
      const combatsResult = await combatService.getCombats(campaign.id);
      if (combatsResult.success) {
        setCombats(combatsResult.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load campaign data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCampaignData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCampaignData();
  };

  const handleCreateCombat = () => {
    Alert.prompt(
      'Create Combat',
      'Enter combat name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name) => {
            if (name && name.trim()) {
              try {
                const result = await combatService.createCombat(campaign.id, name.trim());
                if (result.success) {
                  loadCampaignData(); // Refresh
                  Alert.alert('Success', 'Combat created successfully!');
                } else {
                  Alert.alert('Error', result.error);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to create combat');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderMember = (member) => (
    <View key={member.id} style={styles.memberItem}>
      <Text style={styles.memberName}>{member.user.name || member.user.email}</Text>
      <Text style={[styles.memberRole, member.role === 'DM' && styles.dmRole]}>
        {member.role}
      </Text>
    </View>
  );

  const renderCombat = (combat) => (
    <TouchableOpacity
      key={combat.id}
      style={styles.combatItem}
      onPress={() => navigation.navigate('CombatTracker', { combat })}
    >
      <Text style={styles.combatName}>{combat.name}</Text>
      <Text style={styles.combatStatus}>
        {combat.isActive ? '🟢 Active' : '🔴 Inactive'}
      </Text>
      <Text style={styles.combatParticipants}>
        Participants: {combat.participants?.length || 0}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading campaign details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Campaign Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campaign Info</Text>
        <View style={styles.infoCard}>
          <Text style={styles.campaignName}>{campaignData.name}</Text>
          <Text style={styles.campaignDate}>
            Created: {new Date(campaignData.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.campaignMembers}>
            Members: {members.length}
          </Text>
        </View>
      </View>

      {/* Members */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        <View style={styles.membersList}>
          {members.map(renderMember)}
        </View>
      </View>

      {/* Combats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Combats ({combats.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateCombat}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {combats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No combats yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first combat to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.combatsList}>
            {combats.map(renderCombat)}
          </View>
        )}
      </View>

      {/* Placeholder sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Journal</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>📝 Journal entries coming soon...</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Characters</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>👤 Character sheets coming soon...</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monsters</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>🐉 Monster library coming soon...</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  campaignName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  campaignDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  campaignMembers: {
    fontSize: 14,
    color: '#666',
  },
  membersList: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  dmRole: {
    color: '#dc3545',
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  combatsList: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  combatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  combatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  combatStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  combatParticipants: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  placeholderCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default CampaignDetailsScreen;
