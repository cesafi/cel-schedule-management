import { Card, Radio, Space, Typography, Tag, Alert, Divider } from 'antd';
import {
  VolunteerConflict,
  ConflictResolution,
  ResolutionDecision,
} from '../../../types/batchImport';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ConflictResolutionStepProps {
  conflicts: VolunteerConflict[];
  resolutions: Map<string, ConflictResolution>;
  onResolutionChange: (volunteerName: string, resolution: ConflictResolution) => void;
}

export const ConflictResolutionStep: React.FC<ConflictResolutionStepProps> = ({
  conflicts,
  resolutions,
  onResolutionChange,
}) => {
  const handleDecisionChange = (
    conflict: VolunteerConflict,
    decision: ResolutionDecision
  ) => {
    onResolutionChange(conflict.volunteerName, {
      volunteerName: conflict.volunteerName,
      decision,
      volunteerId:
        decision === 'REUSE_EXISTING'
          ? conflict.existingVolunteer?.id
          : undefined,
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3}>Resolve Conflicts</Title>
          <Paragraph>
            We found {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}{' '}
            that need your attention. Please review and choose how to handle each
            one.
          </Paragraph>
        </div>

        {conflicts.map((conflict) => {
          const resolution = resolutions.get(conflict.volunteerName);
          const isDuplicateInImport =
            conflict.conflictType === 'DUPLICATE_IN_IMPORT';
          const isExistingInDB = conflict.conflictType === 'EXISTING_IN_DB';

          return (
            <Card
              key={conflict.volunteerName}
              title={
                <Space>
                  <UserOutlined />
                  <Text strong>{conflict.volunteerName}</Text>
                  {isDuplicateInImport && (
                    <Tag color="orange">Multiple Departments</Tag>
                  )}
                  {isExistingInDB && <Tag color="blue">Already Exists</Tag>}
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Show conflict details */}
                <div>
                  <Text type="secondary">This volunteer appears in:</Text>
                  <div style={{ marginTop: 8 }}>
                    {conflict.occurrences.map((occ, idx) => (
                      <Tag
                        key={idx}
                        icon={<TeamOutlined />}
                        color={occ.isHead ? 'green' : 'default'}
                        style={{ marginBottom: 4 }}
                      >
                        {occ.departmentName}
                        {occ.isHead && ' (Head)'}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Show existing volunteer info if applicable */}
                {isExistingInDB && conflict.existingVolunteer && (
                  <Alert
                    message="Existing Volunteer Found"
                    description={
                      <div>
                        <Text>
                          A volunteer named "{conflict.existingVolunteer.name}" is
                          already in the database.
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Created:{' '}
                          {new Date(
                            conflict.existingVolunteer.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}

                <Divider style={{ margin: '12px 0' }} />

                {/* Resolution options */}
                <div>
                  <Text strong>How would you like to handle this?</Text>
                  <Radio.Group
                    value={resolution?.decision}
                    onChange={(e) =>
                      handleDecisionChange(conflict, e.target.value)
                    }
                    style={{ marginTop: 12, width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {isExistingInDB && (
                        <Radio value="REUSE_EXISTING">
                          <div>
                            <Text strong>Use existing volunteer</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Add the existing volunteer to the new department(s)
                            </Text>
                          </div>
                        </Radio>
                      )}

                      <Radio value="CREATE_ONE">
                        <div>
                          <Text strong>
                            {isExistingInDB
                              ? 'Create new volunteer'
                              : 'Create one volunteer'}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {isExistingInDB
                              ? 'Create a separate volunteer with this name'
                              : 'Same person across all departments'}
                          </Text>
                        </div>
                      </Radio>

                      {isDuplicateInImport && (
                        <Radio value="CREATE_MULTIPLE">
                          <div>
                            <Text strong>Create separate volunteers</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Different people with same name (will add department
                              suffix)
                            </Text>
                          </div>
                        </Radio>
                      )}
                    </Space>
                  </Radio.Group>
                </div>

                {/* Show resolution status */}
                {resolution && (
                  <Alert
                    message="Decision recorded"
                    type="success"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};
